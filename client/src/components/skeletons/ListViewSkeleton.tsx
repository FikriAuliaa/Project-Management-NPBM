import { Skeleton } from "../ui/skeleton";

export function ListViewSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden h-[calc(100vh-220px)] flex flex-col">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full table-fixed min-w-[1200px]">
          {/* Header */}
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="w-10 px-2 py-3">
                <Skeleton className="h-4 w-4" />
              </th>
              {/* Loop mock headers */}
              <th className="w-64 px-4 py-3">
                <Skeleton className="h-4 w-32" />
              </th>
              <th className="w-32 px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="w-32 px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="w-36 px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="w-36 px-4 py-3">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="w-32 px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="w-32 px-4 py-3">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="w-24 px-4 py-3">
                <Skeleton className="h-4 w-12" />
              </th>
              <th className="w-40 px-4 py-3">
                <Skeleton className="h-4 w-28" />
              </th>
              <th className="w-24 px-4 py-3">
                <Skeleton className="h-4 w-12" />
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {[...Array(10)].map((_, i) => (
              <tr key={i}>
                <td className="px-2 py-3">
                  <Skeleton className="h-4 w-4" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-6 w-20 rounded-md" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-4 w-8" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton className="h-2 w-full rounded-full" />
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
