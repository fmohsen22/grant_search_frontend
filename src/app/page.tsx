'use client';

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
  description: string;
  score: number;
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
          console.log('Data validation passed, setting state...'); // Debug: Pre-state update
          setSearchItems({
            states: response.data.states,
            focus_areas: response.data.focus_areas
          });
          console.log('State updated with:', {
            states: response.data.states.length,
            focus_areas: response.data.focus_areas.length
          }); // Debug: Post-state update
        } else {
          console.error('Invalid response format:', response.data);
        }
      } catch (err) {
        console.error('Error fetching search items:', err);
      } finally {
        setIsInitialLoading(false);
        console.log('Initial loading completed'); // Debug: Loading state
      }
    };

    fetchSearchItems();
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log('Current searchItems state:', searchItems);
  }, [searchItems]);

  // Debug: Options creation
  const stateOptions = searchItems.states.map(state => {
    console.log('Creating state option:', state);
    return { value: state, label: state };
  });
  
  const focusAreaOptions = searchItems.focus_areas.map(area => {
    console.log('Creating focus area option:', area);
    return { value: area, label: area };
  });

  console.log('Final options:', { 
    stateOptions: stateOptions.length, 
    focusAreaOptions: focusAreaOptions.length 
  }); // Debug: Final options count

  const handleSearch = async () => {
    setIsLoading(true);
    setResults('');
    setSearchResponse(null);
    setAnalysisResults('');
    setAnalyzedGrants([]); // Clear any previous analyzed grants
    
    try {
      console.log('Sending search request with:', { selectedStates, selectedFocusAreas });
      const response = await axios.post('/api/scrape-multiple', {
        username: API_CONFIG.CREDENTIALS.username,
        password: API_CONFIG.CREDENTIALS.password,
        states: selectedStates,
        focus_areas: selectedFocusAreas
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });

      console.log('Search response:', response.data);

      if (response.data && response.data.data) {
        // Store the search response for analysis
        setSearchResponse(response.data);
        
        // Format and display the initial results
        const titles = `Available Grants (${response.data.data.length} results found):\n\n` + 
          response.data.data.map((item: any, index: number) => {
            return `${index + 1}. ${item.title}`;
          }).join('\n');
        
        setResults(titles);
      } else {
        console.log('No data in response or invalid format:', response.data);
        setResults('No grants found');
      }
    } catch (error) {
      const err = error as { 
        message: string; 
        code?: string; 
        response?: { 
          data: any; 
          status: number; 
        } 
      };

      console.error('Error details:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.code === 'ECONNABORTED') {
        setResults('Request timed out. Please try again.');
      } else if (err.response?.status === 404) {
        setResults('API endpoint not found. Please check the server configuration.');
      } else if (err.response?.status === 401) {
        setResults('Authentication failed. Please check credentials.');
      } else {
        setResults(`Error occurred while searching grants: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
      console.log('Search operation completed');
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

  const handleAnalyze = async () => {
    if (!searchResponse) {
      console.log('No search response to analyze');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending complete search response for analysis:', searchResponse);
      
      const response = await axios.post(
        'http://localhost:5678/webhook/7331ee44-831d-459a-8dc1-082e87b9663b',
        searchResponse,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Analysis response:', response.data);
      
      if (response.data && response.data.output) {
        try {
          const parsedOutput = JSON.parse(response.data.output);
          console.log('Parsed analysis results:', parsedOutput);
          
          if (parsedOutput.grants && Array.isArray(parsedOutput.grants)) {
            setAnalyzedGrants(parsedOutput.grants);
            setResults(''); // Clear the search results to show analyzed grants
          } else {
            console.error('Invalid analysis format:', parsedOutput);
            setResults('Error: Invalid analysis response format');
          }
        } catch (parseError) {
          console.error('Error parsing output JSON:', parseError);
          setResults('Error: Could not parse analysis results');
        }
      } else {
        console.error('Invalid response format:', response.data);
        setResults('Error: Invalid response from analysis service');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setResults('Error during analysis. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle grant proposal generation
  const handleGenerateProposal = async (action: GrantAction) => {
    try {
      // Endpoint will be provided later - using placeholder for now
      const endpoint = `${API_CONFIG.BACKEND_URL}/generate-proposal`;
      
      await axios.post(endpoint, {
        grantName: action.name,
        grantLink: action.link
      });
      
      // Show success message
      alert(`Successfully requested proposal generation for ${action.name}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process request. Please try again.');
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
                  onclick='window.handleGenerateProposal({ "name": "${grantTitle}", "link": "${grantLink}" })'
                  class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium shadow-md"
                >
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Generate Proposal
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
    if (!analysisResults) return;
    
    const blob = new Blob([analysisResults], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grant-analysis-report.html';
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
                      Download Report
                    </button>
                  </div>

                  {analyzedGrants.map((grant, index) => (
                    <div key={index} className="grant-item bg-gray-700/30 rounded-lg p-6 border border-gray-600">
                      <h3 className="text-2xl font-bold text-white mb-4">{grant.title}</h3>
                      <p className="text-gray-200 text-lg leading-relaxed mb-4">{grant.description}</p>
                      <p className="text-lg font-semibold text-blue-400 mb-4">Score: {grant.score}/100</p>
                      <p className="text-gray-200 text-lg leading-relaxed mb-4">
                        Link to grant: <a href={grant.link} className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">{grant.link}</a>
                      </p>
                      <div className="flex flex-wrap gap-4 mt-4">
                        <button 
                          onClick={() => handleGenerateProposal({ name: grant.title, link: grant.link })}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium shadow-md"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Generate Proposal
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
                    onClick={handleAnalyze}
                    className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-medium shadow-md"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Analyze Results
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
