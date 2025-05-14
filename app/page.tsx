import Link from 'next/link';
import { prisma } from '@/lib/db'; // Use named import for prisma
import React from 'react';

// Helper function to generate Tailwind background colors based on category name
const getCategoryColor = (categoryName: string): string => {
  let hash = 0;
  for (let i = 0; i < categoryName.length; i++) {
    hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32bit integer
  }
  // Define a palette of Tailwind background/hover classes
  const colors = [
    'bg-blue-100 hover:bg-blue-200 text-blue-800 group-hover:text-blue-900',
    'bg-green-100 hover:bg-green-200 text-green-800 group-hover:text-green-900',
    'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 group-hover:text-yellow-900',
    'bg-red-100 hover:bg-red-200 text-red-800 group-hover:text-red-900',
    'bg-purple-100 hover:bg-purple-200 text-purple-800 group-hover:text-purple-900',
    'bg-pink-100 hover:bg-pink-200 text-pink-800 group-hover:text-pink-900',
    'bg-indigo-100 hover:bg-indigo-200 text-indigo-800 group-hover:text-indigo-900',
    'bg-cyan-100 hover:bg-cyan-200 text-cyan-800 group-hover:text-cyan-900',
    'bg-teal-100 hover:bg-teal-200 text-teal-800 group-hover:text-teal-900',
    'bg-orange-100 hover:bg-orange-200 text-orange-800 group-hover:text-orange-900',
    'bg-gray-100 hover:bg-gray-200 text-gray-800 group-hover:text-gray-900',
    'bg-sky-100 hover:bg-sky-200 text-sky-800 group-hover:text-sky-900',
    'bg-amber-100 hover:bg-amber-200 text-amber-800 group-hover:text-amber-900',
    'bg-lime-100 hover:bg-lime-200 text-lime-800 group-hover:text-lime-900',
    'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 group-hover:text-emerald-900',
    'bg-rose-100 hover:bg-rose-200 text-rose-800 group-hover:text-rose-900',
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Helper function to map specific categories to super-categories
const getSuperCategory = (categoryName: string): string => {
  const lowerCaseCategory = categoryName.toLowerCase();
  if (lowerCaseCategory.includes('steel') || lowerCaseCategory.includes('iron') || lowerCaseCategory.includes('aluminum') || lowerCaseCategory.includes('copper') || lowerCaseCategory.includes('titanium') || lowerCaseCategory.includes('magnesium') || lowerCaseCategory.includes('nickel') || lowerCaseCategory.includes('alloy') || lowerCaseCategory.includes('metal')) {
    return 'Metals';
  }
  if (lowerCaseCategory.includes('polymer') || lowerCaseCategory.includes('plastic') || lowerCaseCategory.includes('epoxy') || lowerCaseCategory.includes('resin') || lowerCaseCategory.includes('nylon') || lowerCaseCategory.includes('poly')) {
    return 'Polymers';
  }
  if (lowerCaseCategory.includes('ceramic') || lowerCaseCategory.includes('glass') || lowerCaseCategory.includes('oxide') || lowerCaseCategory.includes('nitride') || lowerCaseCategory.includes('carbide')) {
    return 'Ceramics';
  }
  if (lowerCaseCategory.includes('composite') || lowerCaseCategory.includes('carbon fiber') || lowerCaseCategory.includes('fiberglass')) {
    return 'Composites';
  }
   if (lowerCaseCategory.includes('wood')) {
    return 'Woods';
  }
  return 'Other'; // Default category
};

export default async function HomePage() {
  // Fetch distinct categories from the database
  let categories: string[] = [];
  try {
    const categoriesResult = await prisma.material.findMany({
      distinct: ['category'],
      select: { category: true },
      orderBy: { category: 'asc' } // Sort alphabetically (nulls might appear first or last depending on DB)
    });
    // Filter out nulls in the application code after fetching
    categories = categoriesResult
      .map((c: { category: string | null }) => c.category)
      .filter((c: string | null): c is string => c !== null);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    // Optionally: Return an error state or message component
    // return <div>Error loading categories.</div>;
  }

  // Group categories by super-category
  const groupedCategories: Record<string, string[]> = categories.reduce((acc, category) => {
    const superCategory = getSuperCategory(category);
    if (!acc[superCategory]) {
      acc[superCategory] = [];
    }
    acc[superCategory].push(category);
    return acc;
  }, {} as Record<string, string[]>);

  // Define the desired order for super-categories
  const superCategoryOrder = ['Metals', 'Polymers', 'Ceramics', 'Composites', 'Woods', 'Other'];
  
  // Sort the grouped categories based on the defined order
  const sortedGroupedCategories = Object.entries(groupedCategories).sort(([superA], [superB]) => {
      const indexA = superCategoryOrder.indexOf(superA);
      const indexB = superCategoryOrder.indexOf(superB);
      // Handle cases where a category might not be in the order list (shouldn't happen with 'Other')
      if (indexA === -1 && indexB === -1) return superA.localeCompare(superB); // Alphabetical if both unknown
      if (indexA === -1) return 1; // Unknown categories go last
      if (indexB === -1) return -1; // Unknown categories go last
      return indexA - indexB; // Sort by predefined order
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12 text-gray-800">Material Explorer</h1>
      <p className="text-lg text-center text-gray-600 mb-12 max-w-2xl mx-auto">
        Select a category or view all materials to explore their properties.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {/* Card for All Materials */}
        <Link href="/materials" className="block group col-span-1">
          <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 flex flex-col items-center justify-center h-48 text-center">
            {/* Optional: Add an icon here */}
            <h2 className="text-xl font-semibold text-gray-700 group-hover:text-primary-600 mt-2">All Materials</h2>
            <p className="text-gray-500 mt-1 text-sm">View the complete database</p>
          </div>
        </Link>

        {/* Cards for Categories grouped by Super-Category */}
        {sortedGroupedCategories.map(([superCategory, specificCategories]) => (
          // Use React.Fragment to group elements without adding extra nodes to the DOM
          <React.Fragment key={superCategory}>
            {/* Super-Category Header */}
            <div className="col-span-full mt-8 mb-4"> {/* Span full width */}
              <h2 className="text-2xl font-semibold border-b border-gray-300 pb-2 text-gray-700">
                {superCategory}
              </h2>
            </div>
            {/* Specific Category Cards */}
            {specificCategories.map((category) => (
              <Link 
                key={category} 
                href={`/materials?category=${encodeURIComponent(category)}`} 
                className="block group col-span-1"
              >
                <div 
                  className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-transparent flex flex-col items-center justify-center h-48 text-center ${getCategoryColor(category)}`}
                >
                  {/* Optional: Add category-specific icons here */}
                  <h2 className="text-xl font-semibold mt-2">{category}</h2>
                </div>
              </Link>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
} 