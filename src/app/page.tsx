/// <reference types="react" />
'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import Select, { MultiValue } from 'react-select';
import axios from 'axios';
import { API_CONFIG } from '../config/env';

interface SearchItems {
  states: string[];
  focus_areas: string[];
}

interface SelectOption {
  value: string;
  label: string;
}

interface GrantSelection {
  title: string;
  link: string;
  selected: boolean;
}

interface GrantAction {
  name: string;
  link: string;
}

interface GrantAnalysis {
  title: string;
  deadline: string;
  amount: string;
  short_overview: string;
  why_relevant: string;
  relevance_score: number;
  link: string;
}

export default function GrantSearch() {
  console.log('Component rendering'); // Debug: Component render

  const [searchItems, setSearchItems] = useState<SearchItems>({ states: [], focus_areas: [] });
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [results, setResults] = useState<string>('');
  const [searchResponse, setSearchResponse] = useState<any>(null);
  const [analysisResults, setAnalysisResults] = useState<string>('');
  const [selectedGrants, setSelectedGrants] = useState<GrantSelection[]>([]);
  const [htmlTemplate, setHtmlTemplate] = useState<string>('');
  const [analyzedGrants, setAnalyzedGrants] = useState<GrantAnalysis[]>([]);
  const [stateOptions, setStateOptions] = useState<SelectOption[]>([]);
  const [focusAreaOptions, setFocusAreaOptions] = useState<SelectOption[]>([]);
  const [isGeneratingProposal, setIsGeneratingProposal] = useState<boolean>(false);

  useEffect(() => {
    console.log('useEffect triggered'); // Debug: Effect trigger

    const fetchSearchItems = async () => {
      try {
        console.log('Starting API request...'); // Debug: Request start
        const response = await axios.get('/api/extract_search_items', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Raw API response:', response.data); // Debug: Full response
        
        if (response.data && Array.isArray(response.data.states) && Array.isArray(response.data.focus_areas)) {
          console.log('Valid response format with states and focus areas');
          setStateOptions(response.data.states.map((state: string) => ({ value: state, label: state })));
          setFocusAreaOptions(response.data.focus_areas.map((area: string) => ({ value: area, label: area })));
          setSearchItems({
            states: response.data.states,
            focus_areas: response.data.focus_areas
          });
        } else {
          console.error('Invalid response format:', response.data);
        }
      } catch (error) {
        console.error('API request failed:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchSearchItems();
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log('Current searchItems state:', searchItems);
  }, [searchItems]);

  console.log('Final options:', { 
    stateOptions: stateOptions.length, 
    focusAreaOptions: focusAreaOptions.length 
  }); // Debug: Final options count

  const handleSearch = async () => {
    if (!selectedStates.length || !selectedFocusAreas.length) {
      alert('Please select both states and focus areas');
      return;
    }

    setIsLoading(true);
    setResults(''); // Clear previous results
    try {
      console.log('Sending search request with:', {
        states: selectedStates,
        focus_areas: selectedFocusAreas
      });
      
      const response = await axios.post('/api/scrape-multiple', {
        username: API_CONFIG.CREDENTIALS.username,
        password: API_CONFIG.CREDENTIALS.password,
        states: selectedStates,
        focus_areas: selectedFocusAreas
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('Search response:', response.data);
      setSearchResponse(response.data); // Store complete response for analysis
      
      // Format and display just the grant titles
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        const titles = `Available Grants (${response.data.data.length} results found):\n\n` + 
          response.data.data.map((item: any, index: number) => {
            return `${index + 1}. ${item.title}`;
          }).join('\n');
        setResults(titles);
      } else {
        setResults('No grants found or invalid response format');
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults('Error during search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to safely stringify objects
  const safeStringify = (obj: any) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    }, 2);
  };

  const handleRankGrants = async () => {
    setIsAnalyzing(true);
    setResults('');
    
    try {
      const response = await fetch('http://localhost:8000/rank-grants');
      const data = await response.json();
      setAnalyzedGrants(data);
    } catch (error) {
      console.error('Error:', error);
      setResults('Failed to rank grants. Please check if the backend server is running.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to handle grant proposal generation
  const handleGenerateProposal = async ({ name, link }: GrantAction) => {
    setIsGeneratingProposal(true);
    try {
      const response = await fetch('http://localhost:8000/scrape-grant-detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: link
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      
      // Create file name from grant name
      const fileName = `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_proposal.txt`;
      
      // Create and download the file
      const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error generating proposal:', error);
      alert('Failed to generate proposal. Please try again.');
    } finally {
      setIsGeneratingProposal(false);
    }
  };

  // Update HTML whenever template changes
  useEffect(() => {
    if (htmlTemplate) {
      const modifiedHtml = htmlTemplate.replace(
        /<h1>(.*?)<\/h1>/g,
        (match: string, title: string) => {
          // Don't add button for "Other Grants" section
          if (title === 'Other Grants (Not in Top 10)' || title === 'All other grants') {
            return `<h1 class="text-2xl font-bold text-white mb-4">${title}</h1>`;
          }
          
          return `<div class="grant-item bg-gray-700/30 rounded-lg p-6 border border-gray-600 mb-6">
            <h1 class="text-2xl font-bold text-white mb-4">${title}</h1>`;
        }
      ).replace(
        /<p>(.*?)<\/p>/g,
        (match: string, content: string) => {
          if (content.includes('Score:')) {
            return `<p class="text-lg font-semibold text-blue-400 mt-4 mb-4">${content}</p>`;
          }
          // Check if this is a link
          if (content.includes('Link to grant:')) {
            const grantLink = content.replace('Link to grant:', '').trim();
            const grantTitle = content.split('Link to grant:')[0].trim();
            return `
              <p class="text-gray-200 text-lg leading-relaxed mb-4">${content}</p>
              <div class="flex flex-wrap gap-4 mt-4">
                <button 
                  onClick={() => handleGenerateProposal({ name: grantTitle, link: grantLink })}
                  disabled={isGeneratingProposal}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium shadow-md disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                  {isGeneratingProposal ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Proposal...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate Proposal
                    </>
                  )}
                </button>
              </div>
            </div>`;
          }
          return `<p class="text-gray-200 text-lg leading-relaxed">${content}</p>`;
        }
      );
      setAnalysisResults(modifiedHtml);
    }
  }, [htmlTemplate]);

  // Add handleGenerateProposal to window object for button click handling
  useEffect(() => {
    (window as any).handleGenerateProposal = handleGenerateProposal;
    return () => {
      delete (window as any).handleGenerateProposal;
    };
  }, []);

  const handleDownloadReport = () => {
    if (!analyzedGrants.length) return;
    
    // Create HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Grant Analysis Results</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 1000px; 
            margin: 40px auto; 
            padding: 20px;
            background-color: #1a1b1e;
            color: #ffffff;
          }
          h1 {
            font-size: 32px;
            margin-bottom: 24px;
            color: #ffffff;
          }
          .grant {
            background-color: rgba(55, 65, 81, 0.3);
            border: 1px solid #4b5563;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
          }
          .grant-title {
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
            margin-bottom: 16px;
          }
          .grant-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }
          .meta-item {
            display: flex;
            align-items: center;
          }
          .meta-label {
            color: #60a5fa;
            font-weight: 500;
            margin-right: 8px;
          }
          .meta-value {
            color: #e5e7eb;
          }
          .section {
            margin-bottom: 16px;
          }
          .section-title {
            color: #60a5fa;
            font-weight: 500;
            margin-bottom: 8px;
          }
          .section-content {
            color: #e5e7eb;
            font-size: 16px;
            line-height: 1.6;
          }
          .score {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
          }
          .score-label {
            color: #60a5fa;
            font-weight: 600;
            font-size: 18px;
            margin-right: 8px;
          }
          .score-value {
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
          }
          .grant-link {
            color: #60a5fa;
            text-decoration: none;
          }
          .grant-link:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <h1>Grant Analysis Results</h1>
        ${analyzedGrants.map(grant => `
          <div class="grant">
            <div class="grant-title">${grant.title}</div>
            
            <div class="grant-meta">
              <div class="meta-item">
                <span class="meta-label">Deadline:</span>
                <span class="meta-value">${grant.deadline}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Amount:</span>
                <span class="meta-value">${grant.amount}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Overview</div>
              <div class="section-content">${grant.short_overview}</div>
            </div>

            <div class="section">
              <div class="section-title">Relevance Analysis</div>
              <div class="section-content">${grant.why_relevant}</div>
            </div>

            <div class="score">
              <span class="score-label">Match Score:</span>
              <span class="score-value">${grant.relevance_score}/100</span>
            </div>

            <a href="${grant.link}" class="grant-link" target="_blank">View Grant Details</a>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    
    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grant-analysis-results.html';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleGrantSelection = (title: string) => {
    setSelectedGrants(prev => 
      prev.map(grant => 
        grant.title === title ? { ...grant, selected: !grant.selected } : grant
      )
    );
  };

  const handleApplyForGrants = async () => {
    const selectedGrantsData = selectedGrants
      .filter(grant => grant.selected)
      .map(grant => ({
        title: grant.title,
        link: grant.link
      }));

    if (selectedGrantsData.length === 0) {
      alert('Please select at least one grant to apply for.');
      return;
    }

    try {
      // Replace with your actual API endpoint when it's ready
      const response = await axios.post('/api/create-application', {
        grants: selectedGrantsData
      });
      
      console.log('Application creation response:', response.data);
      alert('Application process initiated for selected grants!');
    } catch (error) {
      console.error('Error creating application:', error);
      alert('Failed to initiate application process. Please try again.');
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading search options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Grant Search Tool</h1>
        <p className="text-gray-300 mb-8 text-lg">Find and analyze grants that match your organization's needs</p>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Search Panel */}
          <div className="w-full md:w-1/3">
            <div className="bg-gray-800 rounded-xl shadow-lg shadow-black/50 p-8 border border-gray-700 hover:shadow-xl transition-shadow duration-300">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Select States
                  </label>
                  <Select<SelectOption, true>
                    isMulti
                    options={stateOptions}
                    onChange={(selected: MultiValue<SelectOption>) => 
                      setSelectedStates(selected.map(item => item.value))
                    }
                    className="basic-multi-select"
                    classNames={{
                      control: (state) => 'border-2 border-gray-600 hover:border-blue-500 bg-gray-700 text-white',
                      menu: () => 'bg-gray-700 border border-gray-600',
                      option: (state) => state.isFocused ? 'bg-gray-600 text-white' : 'text-gray-200',
                      multiValue: () => 'bg-blue-500 text-white',
                      multiValueLabel: () => 'text-white',
                      multiValueRemove: () => 'hover:bg-blue-600 text-white',
                      placeholder: () => 'text-gray-400',
                      input: () => 'text-white'
                    }}
                    placeholder="Choose states..."
                    noOptionsMessage={() => "No states available"}
                    isDisabled={isLoading}
                    styles={{
                      input: (base) => ({
                        ...base,
                        color: 'white'
                      })
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Select Focus Areas
                  </label>
                  <Select<SelectOption, true>
                    isMulti
                    options={focusAreaOptions}
                    onChange={(selected: MultiValue<SelectOption>) => 
                      setSelectedFocusAreas(selected.map(item => item.value))
                    }
                    className="basic-multi-select"
                    classNames={{
                      control: (state) => 'border-2 border-gray-600 hover:border-blue-500 bg-gray-700 text-white',
                      menu: () => 'bg-gray-700 border border-gray-600',
                      option: (state) => state.isFocused ? 'bg-gray-600 text-white' : 'text-gray-200',
                      multiValue: () => 'bg-blue-500 text-white',
                      multiValueLabel: () => 'text-white',
                      multiValueRemove: () => 'hover:bg-blue-600 text-white',
                      placeholder: () => 'text-gray-400',
                      input: () => 'text-white'
                    }}
                    placeholder="Choose focus areas..."
                    noOptionsMessage={() => "No focus areas available"}
                    isDisabled={isLoading}
                    styles={{
                      input: (base) => ({
                        ...base,
                        color: 'white'
                      })
                    }}
                  />
                </div>

                <button
                  onClick={handleSearch}
                  disabled={isLoading || (!selectedStates.length && !selectedFocusAreas.length)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium shadow-md disabled:shadow-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></span>
                      Searching...
                    </span>
                  ) : 'Search Grants'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="w-full md:w-2/3">
            <div className="bg-gray-800 rounded-xl shadow-lg shadow-black/50 p-8 border border-gray-700 min-h-[500px] hover:shadow-xl transition-shadow duration-300">
              {isLoading || isAnalyzing ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-300 text-lg">
                      {isLoading ? 'Searching for grants...' : 'Analyzing grants...'}
                    </p>
                  </div>
                </div>
              ) : analyzedGrants.length > 0 ? (
                <div className="space-y-6">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-3">Detailed Analysis of Most Relevant Grants</h2>
                    <p className="text-gray-300 text-lg mb-6">Below is an analysis of each grant with relevance scores and recommendations:</p>
                    <button
                      onClick={handleDownloadReport}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium shadow-md"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Analyze Results
                    </button>
                  </div>

                  {analyzedGrants.map((grant, index) => (
                    <div key={index} className="grant-item bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                      <h3 className="text-2xl font-bold text-white mb-4">{grant.title}</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center">
                          <span className="text-blue-400 font-medium mr-2">Deadline:</span>
                          <span className="text-gray-200">{grant.deadline}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-blue-400 font-medium mr-2">Amount:</span>
                          <span className="text-gray-200">{grant.amount}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-blue-400 font-medium mb-2">Overview</h4>
                        <p className="text-gray-200 text-lg leading-relaxed">{grant.short_overview}</p>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-blue-400 font-medium mb-2">Relevance Analysis</h4>
                        <p className="text-gray-200 text-lg leading-relaxed">{grant.why_relevant}</p>
                      </div>

                      <div className="flex items-center mb-4">
                        <span className="text-lg font-semibold text-blue-400 mr-2">Match Score:</span>
                        <span className="text-2xl font-bold text-white">{grant.relevance_score}/100</span>
                      </div>

                      <div className="flex items-center justify-between mt-6">
                        <a 
                          href={grant.link} 
                          className="text-blue-400 hover:text-blue-300 underline"
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          View Grant Details
                        </a>
                        <button 
                          onClick={() => handleGenerateProposal({ name: grant.title, link: grant.link })}
                          disabled={isGeneratingProposal}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium shadow-md disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                          {isGeneratingProposal ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Generating Proposal...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Generate Proposal
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : results ? (
                <div>
                  <div className="whitespace-pre-line font-mono text-sm mb-6 p-6 bg-gray-700/50 rounded-lg border border-gray-600 text-gray-200">
                    {results}
                  </div>
                  <button
                    onClick={handleRankGrants}
                    disabled={isAnalyzing}
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium shadow-md"
                  >
                    <span className="material-icons">analytics</span>
                    {isAnalyzing ? 'Ranking...' : 'Rank Grants'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-lg text-gray-400">No results yet. Start by selecting states and focus areas.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
