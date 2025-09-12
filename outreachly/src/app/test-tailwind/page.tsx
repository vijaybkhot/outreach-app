export default function TestTailwind() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tailwind CSS Test
        </h1>
        <p className="text-gray-600 mb-6">
          If you can see this styled properly, Tailwind CSS is working!
        </p>
        <div className="space-y-4">
          <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors">
            Primary Button
          </button>
          <button className="w-full bg-gray-200 text-gray-900 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
            Secondary Button
          </button>
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="bg-red-500 h-8 rounded"></div>
          <div className="bg-green-500 h-8 rounded"></div>
          <div className="bg-blue-500 h-8 rounded"></div>
        </div>
      </div>
    </div>
  );
}
