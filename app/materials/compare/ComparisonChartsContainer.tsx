'use client';

import { useState, useMemo } from 'react';
import ComparisonBarChart from './ComparisonBarChart';
// Import the actual Radar Chart component
import ComparisonRadarChart from './ComparisonRadarChart'; 

// Move formatPropertyName function here
function formatPropertyName(name: string): string {
  // Add spaces before uppercase letters (except the first one)
  let result = name.replace(/([A-Z])/g, ' $1')
  // Capitalize the first letter and handle specific cases
  result = result.charAt(0).toUpperCase() + result.slice(1)
  result = result.replace('Youngs', "Young's") // Correct apostrophe
  // Handle specific calculated properties
  if (name === 'specificStrength') return 'Specific Strength (Yield/Density)';
  if (name === 'specificModulus') return 'Specific Modulus (E/Density)';
  if (name === 'relativeCost') return 'Relative Cost Index';
  return result
}

// Types 
// Copied Material type definition from ComparisonBarChart.tsx
type Material = {
  id: string;
  name: string;
  density?: number | null;
  youngsModulus?: number | null;
  yieldStrength?: number | null;
  ultimateTensileStrength?: number | null;
  poissonsRatio?: number | null;
  shearModulus?: number | null;
  thermalExpansionCoefficient?: number | null;
  relativeCost?: number | null; // Make sure cost is included
  [key: string]: any; // Allow other properties
};

type VizCategory = {
  title: string;
  keys: string[];
};

interface ComparisonChartsContainerProps {
  materials: Material[]; // Use the more specific Material type
  vizCategories: VizCategory[];
  propertyUnitsMap: { [key: string]: string };
}

export default function ComparisonChartsContainer({
  materials,
  vizCategories,
  propertyUnitsMap,
}: ComparisonChartsContainerProps) {

  // State for dropdown filter
  const [selectedChartKey, setSelectedChartKey] = useState<string>('all');
  // State for radar chart visibility
  const [showRadarChart, setShowRadarChart] = useState<boolean>(false);

  // Flatten all keys for the dropdown
  const allVizKeys = useMemo(() => vizCategories.flatMap(cat => cat.keys), [vizCategories]);

  const handleDropdownChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedChartKey(event.target.value);
  };

  // Helper function to render a single chart (avoids repetition)
  const renderChart = (propKey: string) => {
    const key = propKey as string; 
    const materialsWithData = materials.filter(mat => {
        if (key === 'specificStrength') return typeof mat.yieldStrength === 'number' && typeof mat.density === 'number' && mat.density !== 0;
        if (key === 'specificModulus') return typeof mat.youngsModulus === 'number' && typeof mat.density === 'number' && mat.density !== 0;
        if (key === 'relativeCost') return typeof mat.relativeCost === 'number';
        return key in mat && mat[key] !== null && mat[key] !== undefined;
    });

    if (materialsWithData.length > 0) {
        return (
          <ComparisonBarChart
            key={key}
            materials={materialsWithData} 
            propertyKey={key}
            propertyName={formatPropertyName(key)}
            propertyUnitsMap={propertyUnitsMap}
          />
        );
    } else {
        return (
           <div key={key} className="p-4 bg-gray-100 rounded-md text-center text-sm text-gray-500 h-full flex items-center justify-center">
              No data available for {formatPropertyName(key)}.
           </div>
        );
    }
  };

  return (
    <div>
      {/* Filter Controls - Dropdown & Radar Toggle */}
      <div className="mb-8 flex flex-wrap items-center gap-4 p-4 border rounded-md bg-gray-50">
        {/* Dropdown */}
        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
          <label htmlFor="chart-filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            Show Chart:
          </label>
          <select 
            id="chart-filter"
            value={selectedChartKey}
            onChange={handleDropdownChange}
            className="block w-full max-w-xs pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
          >
            <option value="all">All Bar Charts</option>
            {allVizKeys.map(key => (
              <option key={key} value={key}>
                {formatPropertyName(key)}
              </option>
            ))}
          </select>
        </div>
        
        {/* Radar Chart Toggle Button */} 
        <button
           onClick={() => setShowRadarChart(!showRadarChart)}
           className={`px-4 py-1.5 text-sm font-medium rounded-md border ${showRadarChart ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
           {showRadarChart ? 'Hide' : 'Show'} Radar Chart
        </button>
      </div>

      {/* Conditional Radar Chart Rendering */} 
      {showRadarChart && (
         <div className="mb-10 p-6 bg-white shadow rounded-lg border border-gray-200">
           <h3 className="text-xl font-semibold text-gray-800 mb-4">Overall Property Comparison</h3>
           {/* Render the actual Radar Chart Component */}
           <ComparisonRadarChart materials={materials} propertyUnitsMap={propertyUnitsMap} />
           {/* <p className="text-center text-gray-500">(Radar Chart Component Placeholder)</p> */}
         </div>
      )}

      {/* Conditional Bar Chart Rendering */}
      {selectedChartKey === 'all' ? (
        // Render all charts grouped by category
        vizCategories.map((category, catIndex) => (
          // Add hidden class if radar chart is shown? Or just stack them?
          <div key={category.title} className={`${catIndex > 0 ? "mt-10 pt-6 border-t border-gray-200" : ""} ${showRadarChart ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-300`}> 
            <h3 className="text-xl font-medium text-gray-700 mb-6">
              {category.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {category.keys.map(renderChart)} 
            </div>
          </div>
        ))
      ) : (
        // Render only the selected chart (in a simple container)
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${showRadarChart ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-300`}>
            {renderChart(selectedChartKey)}
        </div>
      )}
    </div>
  );
} 