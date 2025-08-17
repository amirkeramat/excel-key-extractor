import React, { useState } from "react";

interface KeysListProps {
  keys: string[];
}

const KeysList: React.FC<KeysListProps> = ({ keys }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filteredKeys = keys.filter((key) =>
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedKeys = showAll ? filteredKeys : filteredKeys.slice(0, 20);
  const hasMore = filteredKeys.length > 20;

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key).then(() => {
      // You could add a toast notification here
      console.log("Copied to clipboard:", key);
    });
  };

  const copyAllKeys = () => {
    const allKeysText = filteredKeys.join("\n");
    navigator.clipboard.writeText(allKeysText).then(() => {
      console.log("All keys copied to clipboard");
    });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search keys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={copyAllKeys}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy All
        </button>
      </div>

      {/* Results Info */}
      <div className="mb-3 text-sm text-gray-600">
        {searchTerm ? (
          <>
            Showing {filteredKeys.length} of {keys.length} keys matching "
            {searchTerm}"
          </>
        ) : (
          <>Total keys found: {keys.length}</>
        )}
      </div>

      {/* Keys List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayedKeys.map((key, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <span className="font-mono text-sm flex-1 break-all">{key}</span>
            <button
              onClick={() => copyToClipboard(key)}
              className="ml-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Copy to clipboard"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {hasMore && !showAll && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Show {filteredKeys.length - 20} more keys
          </button>
        </div>
      )}

      {showAll && hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(false)}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Show less
          </button>
        </div>
      )}

      {filteredKeys.length === 0 && searchTerm && (
        <div className="text-center py-8 text-gray-500">
          No keys found matching "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default KeysList;
