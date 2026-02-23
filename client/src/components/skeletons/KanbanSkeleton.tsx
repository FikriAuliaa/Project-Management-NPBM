import { Skeleton } from "../ui/skeleton";

export function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
      {[1, 2, 3].map((col) => (
        <div
          key={col}
          className="bg-gray-100/50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col min-h-[500px]"
        >
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-4 px-1">
            <Skeleton className="h-6 w-24" /> {/* Title */}
            <Skeleton className="h-5 w-8 rounded-full" /> {/* Count */}
          </div>

          {/* Cards Skeleton Wrapper */}
          <div className="space-y-3">
            {[1, 2, 3].map((card) => (
              <div
                key={card}
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600"
              >
                {/* Card Top: Priority & Dept */}
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-16 rounded" />
                  <Skeleton className="h-4 w-12" />
                </div>

                {/* Card Title */}
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-5 w-3/4 mb-4" />

                {/* Progress Bar */}
                <Skeleton className="h-1.5 w-full rounded-full mb-3" />

                {/* Footer: Date & Icons */}
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <Skeleton className="h-3 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
