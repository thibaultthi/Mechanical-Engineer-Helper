'use client'

import React, { useMemo } from 'react';

// Define the shape of a single material object (adjust based on your actual data)
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
  // Add other potential properties
  [key: string]: any; // Allow other properties, including calculated ones
};

// Define the types for the props
interface ComparisonBarChartProps {
  materials: Material[];
  propertyKey: string; // Use string to allow calculated keys
  propertyName: string;
  propertyUnitsMap: { [key: string]: string }; // Accept the units map
}

// Local constant for colors, could be passed as prop if needed
const barColors = [
  'bg-blue-500', 
  'bg-gray-600',
  'bg-green-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-yellow-500',
];

// Function to generate nice tick values for the axis
function generateAxisTicks(maxValue: number, numTicks: number = 4): number[] {
  if (maxValue <= 0) return [0];
  
  const niceMaxValue = Math.ceil(maxValue / (numTicks)) * (numTicks);
  const interval = niceMaxValue / numTicks;
  
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * interval);
  }
  // Ensure the actual max value isn't drastically smaller than the last tick
  if (maxValue < ticks[ticks.length - 2]) {
       // Recalculate with a slightly smaller max if needed, simple approach:
       const adjustedMaxValue = Math.ceil(maxValue / (numTicks -1 )) * (numTicks -1);
       const adjustedInterval = adjustedMaxValue / (numTicks-1);
       ticks.length = 0; // Clear previous ticks
       for (let i = 0; i <= numTicks -1; i++) {
           ticks.push(i * adjustedInterval);
       }
   }
  
  // Refine ticks to have fewer decimal places if possible
  return ticks.map(tick => parseFloat(tick.toPrecision(3)));
}

export default function ComparisonBarChart({ 
  materials,
  propertyKey,
  propertyName,
  propertyUnitsMap // Use the passed map
}: ComparisonBarChartProps) {

  // Determine unit TYPE based on propertyKey
  let unitType: 'density' | 'modulus' | 'strength' | null = null;
  if (propertyKey === 'density') unitType = 'density';
  else if (['youngsModulus', 'shearModulus'].includes(propertyKey)) unitType = 'modulus';
  else if (['yieldStrength', 'ultimateTensileStrength'].includes(propertyKey)) unitType = 'strength';
  // Explicitly null for properties with fixed units or no units
  else if (['thermalExpansionCoefficient', 'specificStrength', 'specificModulus', 'relativeCost', 'poissonsRatio'].includes(propertyKey)) {
    unitType = null;
  } 

  // Look up the selected unit string using the TYPE, or use predefined unit for special cases
  const unit = unitType ? propertyUnitsMap[unitType] :
               propertyKey === 'thermalExpansionCoefficient' ? 'µm/m·°C' :
               propertyKey === 'specificStrength' ? 'kNm/kg' :
               propertyKey === 'specificModulus' ? 'MNm/kg' :
               propertyKey === 'relativeCost' ? null : // No unit for cost index
               propertyKey === 'poissonsRatio' ? null : // No unit for Poisson's Ratio
               ''; // Default fallback (shouldn't be hit for defined props)

  // Calculate the actual value (Value is already in display units from parent)
  const getValue = (material: Material): number | null | undefined => {
    // Handle derived properties later if needed, ensuring they also return display units
    return material[propertyKey];
  }

  // Helper function to format display values (input value is already in display units)
  const formatDisplayValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';

    const displayValueNum = value; // Use the value directly

    let precision = 0; 
    // Determine precision based on the TARGET unit 
    switch (unit) { 
      case 'GPa': precision = 3; break;
      case 'MPa': precision = 2; break;
      case 'ksi': precision = 3; break;
      case 'lb/ft³': precision = 3; break;
      case 'g/cm³': precision = 3; break;
      case 'kg/m³': precision = 0; break;
      case 'µm/m·°C': precision = 1; break;
      case 'kNm/kg': precision = 1; break; 
      case 'MNm/kg': precision = 1; break; 
      default: 
         if (propertyKey === 'poissonsRatio') precision = 3;
         else if (propertyKey === 'relativeCost') precision = 0; 
         else if (unit === 'psi') precision = 0; 
         else precision = 2; 
         break;
    }
          
     return displayValueNum.toLocaleString(undefined, {
       minimumFractionDigits: precision,
       maximumFractionDigits: precision,
     });
  }

  // Find the maximum value (using getValue which returns display units)
  const maxValue = useMemo(() => {
    let max = 0;
    materials.forEach(material => {
      const displayVal = getValue(material); // Use getValue directly
      if (displayVal !== null && displayVal !== undefined && displayVal > max) {
        max = displayVal;
      }
    });
    return max > 0 ? max * 1.1 : 1; // Add padding
  }, [materials, propertyKey]); // Removed unit dependency

  // Generate ticks for the X-axis
  const numTicks = 5; // Or adjust as needed
  const ticks = useMemo(() => {
    const tickValues = [];
    for (let i = 0; i <= numTicks; i++) {
      tickValues.push((maxValue / numTicks) * i);
    }
    return tickValues;
  }, [maxValue]);

  // Check if there's any valid, positive data to display for this property
  const hasValidData = materials.some(m => {
    const val = getValue(m);
    // Ensure value is a number and greater than 0
    return typeof val === 'number' && val > 0; 
  });

  if (!hasValidData) {
     return (
      <div className="mb-8 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {propertyName} {unit ? `(${unit})` : ''}
        </h3>
        <p className="text-sm text-gray-500">No comparable data available for this property.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{propertyName}</h3>
      <p className="text-sm text-gray-500 mb-6">{unit ? `(${unit})` : ''}</p>
      
      <div className="space-y-4">
        {materials.map((material, index) => {
          // Get the value (already in display units)
          const displayValueNum = getValue(material); 
          // Format it for display
          const displayValueStr = formatDisplayValue(displayValueNum);
          // Calculate percentage based on display value
          const percentage = displayValueNum !== null && displayValueNum !== undefined && maxValue > 0 ? (displayValueNum / maxValue) * 100 : 0;
          const barColor = barColors[index % barColors.length];

          // Determine label style based on bar width
          const labelThresholdPercent = 25; // Adjust threshold as needed
          const isLabelInside = percentage > labelThresholdPercent;
          const labelClasses = `absolute inset-y-0 right-2 flex items-center text-xs font-bold px-1 rounded ${isLabelInside ? 'text-white' : 'text-gray-700'}`;
          const labelStyle = isLabelInside ? { textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)' } : {};

          return (
            <div key={material.id} className="group">
              <span className="text-sm font-medium text-gray-800 block mb-1">
                {material.name}
              </span>
              <div className="flex items-center">
                <div className={`relative w-full h-6 rounded-md overflow-hidden bg-gray-200 mr-2`}> 
                  <div 
                    className={`${barColor} h-full rounded-md transition-all duration-300 ease-out`} 
                    style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                  />
                   {/* Apply conditional styling to label */}
                   <span 
                     className={labelClasses} // Use conditional classes
                     style={labelStyle}      // Use conditional style (for text-shadow)
                   >
                     {/* Display cost as integer */}
                     {displayValueStr} {propertyKey !== 'relativeCost' ? unit : ''} 
                   </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* X-axis Scale */}
      <div className="relative mt-4 h-6">
        {ticks.map((tick, index) => {
           const tickPercentage = maxValue > 0 ? (tick / maxValue) * 100 : 0; 
           
           // Determine precision for the tick label
           let tickPrecision = 0;
           switch (unit) {
             case 'GPa': tickPrecision = 3; break;         // <-- Increased precision
             case 'MPa': tickPrecision = 2; break;         // <-- Increased precision
             case 'ksi': tickPrecision = 3; break;         // <-- Added case
             case 'lb/ft³': tickPrecision = 3; break;     // <-- Added case
             case 'g/cm³': tickPrecision = 3; break;       // <-- Added case
             case 'kg/m³': tickPrecision = 0; break;
             case 'µm/m·°C': tickPrecision = 1; break;
             case 'kNm/kg': tickPrecision = 1; break; 
             case 'MNm/kg': tickPrecision = 1; break; 
             default: 
                if (propertyKey === 'poissonsRatio') tickPrecision = 3;
                else if (propertyKey === 'relativeCost') tickPrecision = 0; // No decimals for cost axis
                else if (unit === 'psi') tickPrecision = 0; // Explicit precision for psi
                else tickPrecision = 2; // Default fallback
                break;
           }

           // Format tick value
           const tickLabel = typeof tick === 'number' 
              ? tick.toLocaleString(undefined, {
                  minimumFractionDigits: tickPrecision, 
                  maximumFractionDigits: tickPrecision
               })
              : 'N/A';

           return (
             <div 
               key={index} 
               className="absolute bottom-0 transform -translate-x-1/2 text-xs text-gray-500"
               style={{ left: `${tickPercentage}%` }}
             >
              {tickLabel}
              <div className="absolute bottom-full left-1/2 w-px h-1.5 bg-gray-300"></div>
             </div>
           );
        })}
         {/* Don't show unit label for cost index axis */}
         <span className="absolute -bottom-5 right-0 text-xs text-gray-500">{propertyKey !== 'relativeCost' ? unit : ''}</span>
      </div>
    </div>
  );
} 