import { prisma } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MaterialCompareClientPage from './MaterialCompareClientPage'

// --- Copied Types & Constants from MaterialsTable --- 
type UnitInfo = {
  factor: number;
  precision: number;
}

type UnitConversionFactors = {
  [key: string]: UnitInfo;
}

const densityUnits: UnitConversionFactors = {
  'kg/m³': { factor: 1, precision: 0 },
  'g/cm³': { factor: 0.001, precision: 3 },
  'lb/ft³': { factor: 0.0160185, precision: 3 },
}

const modulusUnits: UnitConversionFactors = {
  'GPa': { factor: 1e9, precision: 5 },
  'MPa': { factor: 1e6, precision: 2 },
  'ksi': { factor: 6.89476e6, precision: 3 },
  'psi': { factor: 6894.76, precision: 0 },
}

const strengthUnits: UnitConversionFactors = {
  'GPa': { factor: 1e9, precision: 5 },
  'MPa': { factor: 1e6, precision: 2 },
  'ksi': { factor: 6.89476e6, precision: 3 },
  'psi': { factor: 6894.76, precision: 0 },
}
// --- End Copied Types & Constants ---

type MaterialCompareProps = {
  searchParams: { [key: string]: string | string[] | undefined }
}

// Simple color mapping for category badges (copied from MaterialsTable)
const categoryColorMap: { [key: string]: string } = {
  Steel: 'bg-gray-100 text-gray-800',
  'Stainless Steel': 'bg-blue-100 text-blue-800',
  'Tool Steel': 'bg-red-100 text-red-800',
  Aluminum: 'bg-sky-100 text-sky-800',
  Plastic: 'bg-green-100 text-green-800', // Changed category from Polymer
  Ceramic: 'bg-purple-100 text-purple-800',
  Composite: 'bg-yellow-100 text-yellow-800',
  Wood: 'bg-amber-100 text-amber-800',
  Rubber: 'bg-indigo-100 text-indigo-800',
  Glass: 'bg-cyan-100 text-cyan-800',
  Polymer: 'bg-green-100 text-green-800', // Added Polymer explicitly
  Thermoset: 'bg-orange-100 text-orange-800', // Added Thermoset
  // Add more categories and corresponding Tailwind classes
};
const defaultCategoryColor = 'bg-slate-100 text-slate-800';

// Define which properties to display in the table using the inferred type
// Note: Removed properties handled by charts if desired, keeping core ones
const propertiesToDisplay: (keyof InferredMaterialData)[] = [
  'category', 
  'density',
  'youngsModulus',
  'yieldStrength',
  'ultimateTensileStrength',
  'poissonsRatio',
  'shearModulus',
  'thermalExpansionCoefficient',
];

// Define categories for visualization (can be adjusted)
const vizCategories = [
  {
    title: "Base Mechanical Properties",
    keys: ['density', 'youngsModulus', 'yieldStrength', 'ultimateTensileStrength', 'shearModulus']
  },
  {
    title: "Thermal Properties",
    keys: ['thermalExpansionCoefficient']
  },
  // {
  //   title: "Derived Performance Metrics",
  //   keys: ['specificStrength', 'specificModulus']
  // },
  // {
  //   title: "Economic Factors",
  //   keys: ['relativeCost']
  // }
];

// Ensure all keys we want to visualize are actually defined in vizCategories
const allVizKeys = vizCategories.flatMap(cat => cat.keys);

// Removed static propertyUnitsMap, units handled by state now

// Simplified formatValue for non-unit-selectable columns
function formatCategory(value: string | number | null | Date | undefined): React.ReactNode {
  const category = typeof value === 'string' ? value : 'Uncategorized';
  const categoryClasses = categoryColorMap[category] || defaultCategoryColor;
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryClasses}`}
    >
      {category}
    </span>
  );
}

function formatSimpleValue(value: number | null | undefined, precision: number): string {
   if (value === null || value === undefined) return 'N/A';
   return value.toLocaleString(undefined, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    });
}

function formatExponential(value: number | null | undefined): string {
   if (value === null || value === undefined) return 'N/A';
   return value.toExponential(2);
}

// Keep getMaterials function here (Server-side data fetching)
async function getMaterials(ids: string[]) {
  if (!ids || ids.length === 0) {
    return [];
  }
  try {
    console.log(`[getMaterials] Attempting to fetch materials for IDs: ${ids.join(', ')}`);
    const materials = await prisma.material.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      // Keep the required select fields
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
      },
    });
    console.log(`[getMaterials] Successfully fetched ${materials.length} materials.`);
    return materials;
  } catch (error) {
    console.error("[getMaterials] Error fetching materials:", error);
    if (error instanceof Error) {
      console.error("[getMaterials] Error name:", error.name);
      console.error("[getMaterials] Error message:", error.message);
      if ('code' in error) { // For Prisma-specific errors
         console.error("[getMaterials] Prisma Error Code:", (error as any).code);
      }
    }
    // Re-throwing to ensure build fails and Vercel shows it
    throw new Error(`[getMaterials] Failed to fetch materials from DB during build. Original error: ${(error as Error).message}`);
  }
}

// Keep type inference if needed for props
type InferredMaterialData = Awaited<ReturnType<typeof getMaterials>>[number];

// Keep the Wrapper Component (Server Component) 
async function MaterialComparePageWrapper({ searchParams }: MaterialCompareProps) {
   const idsParam = searchParams?.ids
   const ids = typeof idsParam === 'string' ? idsParam.split(',').filter(Boolean) : []

  if (ids.length === 0) {
     return (
       <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-semibold mb-4">No Materials Selected</h1>
        <p className="text-gray-600 mb-6">Please select materials from the table to compare.</p>
        <Link href="/" className="text-blue-600 hover:underline">
          Back to Materials Table
        </Link>
      </div>
    );
  }

  const materials = await getMaterials(ids)
  
   // Pass the fetched materials and ordered IDs to the *imported* client component
   return <MaterialCompareClientPage materials={materials} orderedIds={ids} />;
 }

// Export the Server Component wrapper as the default export for the page route
export default MaterialComparePageWrapper; 