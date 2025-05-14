'use client'

import { useState } from 'react'
import Link from 'next/link'
import ComparisonChartsContainer from './ComparisonChartsContainer'

// --- Copied Types & Constants from MaterialsTable ---
/**
 * UnitInfo describes how to convert from SI to the display unit:
 *   convertedValue = siValue / factor
 *   and how many decimal places to show.
 */
type UnitInfo = {
  factor: number;
  precision: number;
}

type UnitConversionFactors = {
  [key: string]: UnitInfo;
}

const densityUnits: UnitConversionFactors = {
  'kg/m³': { factor: 1, precision: 0 },        // SI base (kg/m³)
  'g/cm³': { factor: 1000, precision: 3 },     // 1 g/cm³ = 1000 kg/m³
  'lb/ft³': { factor: 16.0185, precision: 3 }, // 1 lb/ft³ = 16.0185 kg/m³
}

const modulusUnits: UnitConversionFactors = {
  'GPa': { factor: 1e9, precision: 5 },         // 1 GPa = 1e9 Pa
  'MPa': { factor: 1e6, precision: 2 },         // 1 MPa = 1e6 Pa
  'ksi': { factor: 6.89476e6, precision: 3 },   // 1 ksi = 6.89476e6 Pa
  'psi': { factor: 6894.76, precision: 0 },     // 1 psi = 6894.76 Pa
}

const strengthUnits: UnitConversionFactors = {
  'MPa': { factor: 1e6, precision: 2 },         // UTS & yield in MPa raw
  'ksi': { factor: 6.89476e6, precision: 3 },   // same as modulus
  'psi': { factor: 6894.76, precision: 0 },
  'GPa': { factor: 1e9, precision: 5 },         // allow GPa
}
// --- End Copied Types & Constants ---

// Simple color mapping for category badges
const categoryColorMap: { [key: string]: string } = {
  Steel: 'bg-gray-100 text-gray-800',
  'Stainless Steel': 'bg-blue-100 text-blue-800',
  'Tool Steel': 'bg-red-100 text-red-800',
  Aluminum: 'bg-sky-100 text-sky-800',
  Plastic: 'bg-green-100 text-green-800',
  Ceramic: 'bg-purple-100 text-purple-800',
  Composite: 'bg-yellow-100 text-yellow-800',
  Wood: 'bg-amber-100 text-amber-800',
  Rubber: 'bg-indigo-100 text-indigo-800',
  Glass: 'bg-cyan-100 text-cyan-800',
  Polymer: 'bg-green-100 text-green-800',
  Thermoset: 'bg-orange-100 text-orange-800',
};
const defaultCategoryColor = 'bg-slate-100 text-slate-800';

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

// --- Data Types ---
type InferredMaterialData = {
  id: string;
  name: string;
  density: number | null;                         // in kg/m³
  youngsModulus: number | null;                   // in GPa
  yieldStrength: number | null;                   // in MPa
  ultimateTensileStrength: number | null;         // in MPa
  poissonsRatio: number | null;
  shearModulus: number | null;                    // in GPa
  thermalExpansionCoefficient: number | null;     // in 1/°C
  category: string | null;
};

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
  // Ensure any category containing 'relativeCost' is removed or commented out.
  // For example, remove or comment out:
  // {
  //   title: "Economic Factors",
  //   keys: ['relativeCost'] // <--- REMOVE/COMMENT THIS
  // }
];

export default function MaterialCompareClientPage({ materials, orderedIds }: {
  materials: InferredMaterialData[];
  orderedIds: string[];
}) {
  // Unit selection state
  const [selectedUnits, setSelectedUnits] = useState({
    density: 'kg/m³',
    modulus: 'GPa',
    strength: 'MPa',
  });

  // Function to handle unit changes
  const handleUnitChange = (field: 'density' | 'modulus' | 'strength', value: string) => {
    setSelectedUnits(prev => ({ ...prev, [field]: value }))
  }

  // --- Helper function to calculate the raw converted value ---
  const calculateConvertedValue = (value: number | null, unitType: 'density' | 'modulus' | 'strength'): number | null => {
    if (value === null) return null;
    const conversionFactors = { 'density': densityUnits, 'modulus': modulusUnits, 'strength': strengthUnits };
    const factors = conversionFactors[unitType];
    const selectedUnit = selectedUnits[unitType];
    const unitInfo = factors[selectedUnit as keyof typeof factors];
    return value / unitInfo.factor;
  }

  // --- Function to format the value for display --- 
  const formatConvertedValueForDisplay = (value: number | null, unitType: 'density' | 'modulus' | 'strength'): string => {
    if (value === null) return 'N/A';
    const conversionFactors = { 'density': densityUnits, 'modulus': modulusUnits, 'strength': strengthUnits };
    const factors = conversionFactors[unitType];
    const selectedUnit = selectedUnits[unitType];
    const unitInfo = factors[selectedUnit as keyof typeof factors];
    const convertedValue = value / unitInfo.factor;
    // Format the convertedValue, allowing trailing zeros to be omitted
    return convertedValue.toLocaleString(undefined, { 
      minimumFractionDigits: 0, // Allow fewer decimals if trailing zeros
      maximumFractionDigits: unitInfo.precision // But limit to the defined max precision
    })
  }
  // --- End conversion functions ---

  // Reorder materials
  const orderedMaterials = orderedIds
    .map(id => materials.find(m => m.id === id))
    .filter((m): m is InferredMaterialData => m !== undefined);

  if (orderedMaterials.length === 0) {
    return <div className="p-8 text-center text-red-600">Error: Could not display materials.</div>;
  }

  // Prepare data for charts (using calculated raw values)
  const chartData = orderedMaterials.map(material => ({
      id: material.id,
      name: material.name,
      category: material.category || 'Uncategorized',
      // Use calculateConvertedValue for raw numbers for charts
      density: calculateConvertedValue(material.density, 'density'),
      youngsModulus: calculateConvertedValue(material.youngsModulus, 'modulus'),
      yieldStrength: calculateConvertedValue(material.yieldStrength, 'strength'),
      ultimateTensileStrength: calculateConvertedValue(material.ultimateTensileStrength, 'strength'),
      shearModulus: calculateConvertedValue(material.shearModulus, 'modulus'),
      // Convert TEC to display units (µm/m·°C) here for charts too
      thermalExpansionCoefficient: material.thermalExpansionCoefficient ? material.thermalExpansionCoefficient * 1e6 : null,
  }));

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Responsive Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 sm:mb-0">
            Compare Materials ({orderedMaterials.length})
          </h1>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800">
            &larr; Back to Materials Table
          </Link>
        </div>

        {/* Unit controls */}
        <div className="mb-6 p-4 bg-white shadow rounded-lg flex flex-wrap items-center gap-4">
          {/* Density */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Density</label>
            <select
              value={selectedUnits.density}
              onChange={e => handleUnitChange('density', e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-1.5 pl-2 pr-7"
            >
              {Object.keys(densityUnits).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Modulus */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Modulus</label>
            <select
              value={selectedUnits.modulus}
              onChange={e => handleUnitChange('modulus', e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-1.5 pl-2 pr-7"
            >
              {Object.keys(modulusUnits).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          {/* Strength */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Strength</label>
            <select
              value={selectedUnits.strength}
              onChange={e => handleUnitChange('strength', e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-1.5 pl-2 pr-7"
            >
              {Object.keys(strengthUnits).map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Comparison table */}
        <div className="bg-white shadow-lg rounded-lg overflow-x-auto mb-12">
          <table className="min-w-full divide-y divide-gray-200 border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider border-r border-gray-300 w-1/4">
                  Property
                </th>
                {orderedMaterials.map(m => (
                  <th
                    key={m.id}
                    className="px-6 py-4 text-left text-sm font-semibold text-gray-800 border-r border-gray-300 last:border-r-0"
                  >
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {propertiesToDisplay.map((propKey, rowIndex) => {
                let unitLabel = '';
                if (propKey === 'density') unitLabel = selectedUnits.density;
                else if (propKey === 'youngsModulus' || propKey === 'shearModulus') unitLabel = selectedUnits.modulus;
                else if (propKey === 'yieldStrength' || propKey === 'ultimateTensileStrength') unitLabel = selectedUnits.strength;
                else if (propKey === 'thermalExpansionCoefficient') unitLabel = 'µm/m·°C';

                // Determine responsive classes for rows/cells based on propKey
                let rowClasses = '';
                if (propKey === 'shearModulus' || propKey === 'thermalExpansionCoefficient') {
                  rowClasses = 'hidden md:table-row'; // Hide entire row below md
                }

                return (
                  <tr
                    key={propKey}
                    className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150 ease-in-out ${rowClasses}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 border-r border-gray-300">
                      {propKey}
                      {unitLabel && <span className="text-xs text-gray-500 ml-1">({unitLabel})</span>}
                    </td>
                    {orderedMaterials.map((material) => {
                      const cellValue = material[propKey];
                      let displayContent: React.ReactNode;

                      if (propKey === 'density') {
                        displayContent = formatConvertedValueForDisplay(cellValue as number | null, 'density');
                      } else if (propKey === 'youngsModulus' || propKey === 'shearModulus') {
                        displayContent = formatConvertedValueForDisplay(cellValue as number | null, 'modulus');
                      } else if (propKey === 'yieldStrength' || propKey === 'ultimateTensileStrength') {
                        displayContent = formatConvertedValueForDisplay(cellValue as number | null, 'strength');
                      } else if (propKey === 'category') {
                        displayContent = formatCategory(cellValue);
                      } else if (propKey === 'poissonsRatio') {
                        displayContent = formatSimpleValue(cellValue as number | null, 3);
                      } else if (propKey === 'thermalExpansionCoefficient') {
                        const tecValue = cellValue as number | null;
                        const convertedTec = tecValue !== null ? tecValue * 1e6 : null;
                        displayContent = formatSimpleValue(convertedTec, 1);
                      } else {
                        displayContent = cellValue === null || cellValue === undefined ? 'N/A' : String(cellValue);
                      }

                      return (
                        <td
                          key={`${material.id}-${propKey}`}
                          className={`px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-r border-gray-300 last:border-r-0 text-center`}
                        >
                          {displayContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ComparisonChartsContainer
          materials={chartData}
          propertyUnitsMap={selectedUnits}
          vizCategories={vizCategories}
        />
      </div>
    </div>
  )
}
 