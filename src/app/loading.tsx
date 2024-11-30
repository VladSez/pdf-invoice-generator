export default function Loading() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex flex-col lg:flex-row gap-8 max-w-[1400px] mx-auto">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="h-8 w-full lg:w-64 bg-gray-200 rounded animate-pulse" />

          {/* Form fields skeleton */}
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Right side - PDF Preview */}
        <div className="w-full lg:w-2/3">
          <div className="bg-gray-200 rounded-lg h-[700px] animate-pulse">
            <div className="flex justify-between items-center p-4 bg-gray-300 rounded-t-lg">
              <div className="h-6 w-full lg:w-48 bg-gray-400 rounded animate-pulse" />
              <div className="gap-2 hidden lg:flex">
                <div className="h-8 w-32 bg-gray-400 rounded animate-pulse" />
                <div className="h-8 w-32 bg-blue-400 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
