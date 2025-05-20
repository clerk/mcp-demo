"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { submitIntegration } from "./add-mcp-action";

export default function IndexPageInternal() {
  const [needsCredentials, setNeedsCredentials] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toolResponse, setToolResponse] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client_id");

  // pull client id from the url, if present, hit fapi and get client details
  // load those instead of the mcp form, but include a way to reset
  // tool call submits to server action which makes a call to resource server
  // using the oauth token stored with the client id

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      await submitIntegration(formData);
      // we expect this to return a redirect, so not handling the response
    } catch (error) {
      console.error("Error submitting integration:", error);
      setError((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-4">
      <div className="flex flex-col md:flex-row w-full gap-6 max-w-6xl mx-auto mt-20">
        {/* Left Section - Form or Connected Status */}
        <div className="flex-1">
          {clientId ? (
            <div className="bg-white rounded-lg shadow-md p-6 h-full">
              <div className="flex items-center justify-center mb-6">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
                MCP Connected
              </h2>
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <p className="text-sm text-gray-600 mb-2">Client ID:</p>
                <p className="text-gray-800 font-medium break-all">
                  {clientId}
                </p>
              </div>
              <div className="flex justify-center">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  onClick={() => (window.location.href = "/")}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
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

                {error && (
                  <div className="text-red-500 text-sm mb-0">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full ${
                    isSubmitting
                      ? "bg-blue-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors mt-6`}
                >
                  {isSubmitting ? "Adding..." : "Add Integration"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Section - Tool Call Button */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md p-6 h-full flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Tool Call
            </h2>
            <p className="text-gray-600 mb-8 text-center">
              Click the button below to trigger an MCP tool call that rolls a
              dice.
            </p>
            <button
              className="bg-emerald-600 text-white py-3 px-6 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors font-medium text-lg"
              onClick={() => {
                fetch("/call_tool", {
                  method: "POST",
                  body: JSON.stringify({ clientId }),
                })
                  .then((res) => res.json())
                  .then((res) => {
                    setToolResponse(res.content);
                  });
              }}
            >
              Trigger Tool Call
            </button>
            {toolResponse ? (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-[300px] overflow-auto w-full">
                <pre className="text-sm whitespace-pre-wrap break-words font-mono">
                  <code className="text-gray-800">
                    {JSON.stringify(toolResponse, null, 2)}
                  </code>
                </pre>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
