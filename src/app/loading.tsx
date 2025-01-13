export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 lg:flex-row">
        {/* Left side - Form */}
        <div className="w-full space-y-6 lg:w-1/3">
          <div className="h-8 w-full animate-pulse rounded bg-gray-200 lg:w-64" />

          {/* Form fields skeleton */}
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                <div className="h-10 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>

        {/* Right side - PDF Preview */}
        <div className="w-full lg:w-2/3">
          <div className="h-[700px] animate-pulse rounded-lg bg-gray-200">
            <div className="flex items-center justify-between rounded-t-lg bg-gray-300 p-4">
              <div className="h-6 w-full animate-pulse rounded bg-gray-400 lg:w-48" />
              <div className="hidden gap-2 lg:flex">
                <div className="h-8 w-32 animate-pulse rounded bg-gray-400" />
                <div className="h-8 w-32 animate-pulse rounded bg-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
