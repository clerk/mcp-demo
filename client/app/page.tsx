"use client";

import { useState } from "react";
import { submitIntegration } from "./add-mcp-action";

export default function Home() {
  const [needsCredentials, setNeedsCredentials] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      await submitIntegration(formData);
      // Could handle success state here, like showing a success message
    } catch (error) {
      console.error("Error submitting integration:", error);
      // Could handle error state here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4">
      <div className="flex flex-col md:flex-row w-full gap-6 max-w-6xl mx-auto mt-20">
        {/* Left Section - Form */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-6 h-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Add an MCP Integration
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="url"
                >
                  MCP Server URL
                </label>
                <input
                  id="url"
                  name="url"
                  type="text"
                  defaultValue="http://localhost:3001/mcp"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center mt-4">
                <input
                  id="needs-credentials"
                  name="needs-credentials"
                  type="checkbox"
                  checked={needsCredentials}
                  onChange={(e) => setNeedsCredentials(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="needs-credentials"
                  className="ml-2 block text-sm text-gray-700"
                >
                  No dynamic client registration
                </label>
              </div>

              {needsCredentials && (
                <>
                  <div className="space-y-2">
                    <label
                      className="block text-sm font-medium text-gray-700"
                      htmlFor="client_id"
                    >
                      Client ID
                    </label>
                    <input
                      id="client_id"
                      name="client_id"
                      type="text"
                      required={needsCredentials}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className="block text-sm font-medium text-gray-700"
                      htmlFor="client_secret"
                    >
                      Client Secret
                    </label>
                    <input
                      id="client_secret"
                      name="client_secret"
                      type="password"
                      required={needsCredentials}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full ${
                  isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
                } text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors mt-6`}
              >
                {isSubmitting ? "Adding..." : "Add Integration"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Section - Tool Call Button */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Tool Call
            </h2>
            <p className="text-gray-600 mb-8 text-center">
              Click the button below to trigger an MCP tool call
            </p>
            <button className="bg-emerald-600 text-white py-3 px-6 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors font-medium text-lg">
              Trigger Tool Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
