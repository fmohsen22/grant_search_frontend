'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Grant {
  id: string;
  title: string;
  overview: string;
  funder: string;
  url: string;
  deadline: string;
}

interface Application {
  id: string;
  applied: boolean;
  proposal_path: string;
  created_at: string;
}

interface GrantWithApplication {
  grant: Grant;
  application: Application;
}

interface ExpandedOverviews {
  [key: string]: boolean;
}

export default function GrantHistory() {
  const [grants, setGrants] = useState<GrantWithApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedOverviews, setExpandedOverviews] = useState<ExpandedOverviews>({});

  useEffect(() => {
    fetchGrants();
  }, []);

  const fetchGrants = async () => {
    try {
      const response = await fetch('https://norooz-backend.fly.dev/grants-with-applications', {
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch grants');
      }
      const data = await response.json();
      setGrants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async (grantId: string) => {
    try {
      const response = await fetch(`https://norooz-backend.fly.dev/apply?grant_id=${grantId}`, {
        method: 'POST',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });
      if (!response.ok) throw new Error('Failed to apply');
      fetchGrants(); // Refresh the list
    } catch (err) {
      alert('Failed to apply for grant');
    }
  };

  const handleUpdate = async (grantId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`https://norooz-backend.fly.dev/update-proposal?grant_id=${grantId}`, {
          method: 'POST',
          headers: {
            'Origin': 'http://localhost:3000'
          },
          body: formData
        });
        if (!response.ok) throw new Error('Failed to update');
        fetchGrants(); // Refresh the list
      } catch (err) {
        alert('Failed to update proposal');
      }
    };
    input.click();
  };

  const handleDelete = async (grantId: string) => {
    if (!confirm('Are you sure you want to delete this grant?')) return;

    try {
      const response = await fetch(`https://norooz-backend.fly.dev/delete-grant/${grantId}`, {
        method: 'DELETE',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });
      if (!response.ok) throw new Error('Failed to delete');
      fetchGrants(); // Refresh the list
    } catch (err) {
      alert('Failed to delete grant');
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      // Double encode the filename to handle special characters properly
      const justFilename = filename.split('/').pop()!;
      const encodedFilename = encodeURIComponent(justFilename);
      const response = await fetch(`https://norooz-backend.fly.dev/download-proposal?filename=${encodedFilename}`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Accept': 'application/octet-stream'
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed with status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use the last part of the path as the download filename
      const downloadFilename = filename.split('/').pop() || filename;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download proposal. Please try again.');
    }
  };

  const toggleOverview = (grantId: string) => {
    setExpandedOverviews(prev => ({
      ...prev,
      [grantId]: !prev[grantId]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-blue-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
            <h2 className="text-lg font-semibold">Error</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Grant History</h1>
          <Link 
            href="/"
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Back to Search
          </Link>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Grant ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Grant Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Overview</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Funder</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Deadline</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Applied</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Proposal File</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {grants.map(({ grant, application }) => (
                  <tr key={grant.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{grant.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{grant.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <div className="relative">
                        <div className={expandedOverviews[grant.id] ? "whitespace-pre-wrap" : "line-clamp-2"}>
                          {grant.overview}
                        </div>
                        {grant.overview.length > 100 && (
                          <button
                            onClick={() => toggleOverview(grant.id)}
                            className="text-blue-400 hover:text-blue-300 mt-1"
                          >
                            {expandedOverviews[grant.id] ? 'Show Less' : 'Show More'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{grant.funder}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{grant.deadline}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {application.applied ? 
                        <span className="text-green-500">✅</span> : 
                        <span className="text-red-500">❌</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {application.proposal_path ? 
                        <span className="text-blue-400">{application.proposal_path.split('/').pop()}</span> : 
                        'No file'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(application.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleApply(grant.id)}
                        className="text-blue-400 hover:text-blue-300"
                        title="Apply"
                      >
                        ✅
                      </button>
                      <button
                        onClick={() => handleUpdate(grant.id)}
                        className="text-yellow-400 hover:text-yellow-300"
                        title="Update Proposal"
                      >
                        📝
                      </button>
                      {application.proposal_path && (
                        <button
                          onClick={() => handleDownload(application.proposal_path)}
                          className="text-green-400 hover:text-green-300"
                          title="Download Proposal"
                        >
                          📥
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(grant.id)}
                        className="text-red-400 hover:text-red-300"
                        title="Delete"
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 