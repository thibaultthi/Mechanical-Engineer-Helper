import MaterialsTable from './MaterialsTable'
import { prisma } from '@/lib/db'
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Define the expected shape of searchParams
interface MaterialsPageProps {
  searchParams?: { 
    category?: string; 
    // Add other potential search params here if needed
  };
}

// Fetches ALL materials, ignoring category parameter
async function getMaterials() { 
  return await prisma.material.findMany({
    select: {
      id: true,
      name: true,
      density: true,
      youngsModulus: true,
      yieldStrength: true,
      ultimateTensileStrength: true,
      poissonsRatio: true,
      shearModulus: true,
      thermalExpansionCoefficient: true,
      category: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      name: 'asc' 
    }
  });
}

// Accept searchParams prop
export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
  // Get the category from URL to pass as initial filter hint
  const initialCategoryFilter = searchParams?.category; 
  
  // Fetch all materials
  const initialMaterials = await getMaterials();
  
  // Keep display logic simple, as filtering is client-side
  // Title could be generic or subtly indicate the initial filter if desired
  const pageTitle = "Material Properties"; 
  const pageDescription = "Comprehensive reference data for common engineering materials. Use filters to narrow results.";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Keep Home button */}
        <div className="mb-6 flex justify-start items-center">
          <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            &larr; Back to Home
          </Link>
          {/* Category filter dropdown removed */}
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{pageTitle}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {pageDescription}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Pass ALL materials and the initial filter hint */}
          <MaterialsTable 
            initialMaterials={initialMaterials} 
            initialCategoryFilter={initialCategoryFilter} 
          />
        </div>
      </div>
    </div>
  )
} 