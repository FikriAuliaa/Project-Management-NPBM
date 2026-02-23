import { useState } from "react";
import type { Attachment } from "../types";
import { X, ExternalLink, Link } from "lucide-react";

type AttachmentInputProps = {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
};

/**
 * Component for managing task attachments (currently specialized for external links).
 * Allows users to manually add, view, and remove URL links associated with a task.
 */
export function AttachmentInput({
  attachments,
  onChange,
}: AttachmentInputProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const handleAddLink = () => {
    if (!linkName.trim() || !linkUrl.trim()) return;

    // Normalize URL to ensure it includes a valid HTTP/HTTPS protocol for external routing
    let finalUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    const newLink: Attachment = {
      id: `${Date.now()}-${Math.random()}`,
      name: linkName,
      type: "link",
      url: finalUrl,
      uploadedAt: new Date().toISOString(),
    };

    onChange([...attachments, newLink]);
    setLinkName("");
    setLinkUrl("");
    setShowLinkInput(false);
  };

  const handleRemove = (id: string) =>
    onChange(attachments.filter((att) => att.id !== id));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Attachments (Links)
      </label>

      {attachments.length > 0 && (
        <div className="space-y-2 mb-3">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {attachment.name}
                  </div>
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 truncate block hover:underline"
                  >
                    {attachment.url}
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(attachment.id)}
                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors"
                title="Remove link"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showLinkInput ? (
        <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
              Display Name
            </label>
            <input
              type="text"
              placeholder="e.g. Google Drive Folder"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
              URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowLinkInput(false)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddLink}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save Link
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowLinkInput(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all text-sm font-medium"
        >
          <Link className="w-4 h-4" />
          Add External Link
        </button>
      )}
    </div>
  );
}
