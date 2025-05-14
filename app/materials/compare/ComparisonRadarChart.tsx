'use client';

import React from 'react';
import {
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  Legend, 
  Tooltip
} from 'recharts';

// Type matching the data structure passed from the container
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
  relativeCost?: number | null;
  // Allow for calculated values added during processing
  specificStrength?: number | null;
  specificModulus?: number | null;
  [key: string]: any; 
};

interface ComparisonRadarChartProps {
  materials: Material[];
  propertyUnitsMap: { [key: string]: string };
}

// Define the properties to include in the radar chart and their "ideal" direction (higher or lower is better)
const radarProperties: { key: keyof Material | 'specificStrength' | 'specificModulus', label: string, higherIsBetter: boolean }[] = [
  { key: 'youngsModulus', label: 'E Modulus', higherIsBetter: true },
  { key: 'ultimateTensileStrength', label: 'UTS', higherIsBetter: true },
  { key: 'yieldStrength', label: 'Yield Str.', higherIsBetter: true },
  { key: 'density', label: 'Density', higherIsBetter: false }, // Lower is better
  { key: 'specificModulus', label: 'Specific Mod.', higherIsBetter: true },
  { key: 'specificStrength', label: 'Specific Str.', higherIsBetter: true },
  { key: 'thermalExpansionCoefficient', label: 'Therm. Exp.', higherIsBetter: false }, // Lower is better
  // { key: 'relativeCost', label: 'Cost Index', higherIsBetter: false }, // <-- REMOVED/COMMENTED OUT
];

// Define colors for the radar areas/lines (similar to bar chart colors)
const radarColors = [
  '#3b82f6', // blue-500
  '#4b5563', // gray-600
  '#22c55e', // green-500
  '#ef4444', // red-500
  '#a855f7', // purple-500
  '#eab308', // yellow-500
];


export default function ComparisonRadarChart({ 
  materials,
  propertyUnitsMap 
}: ComparisonRadarChartProps) {

  // 1. Pre-process data: Calculate derived properties if needed
  const processedMaterials = React.useMemo(() => {
    return materials.map(mat => {
      const processedMat = { ...mat }; // Clone

      // Calculate Specific Strength (Yield/Density) -> kNm/kg
      if (typeof mat.yieldStrength === 'number' && typeof mat.density === 'number' && mat.density !== 0) {
        processedMat.specificStrength = (mat.yieldStrength / mat.density) / 1000;
      }
      // Calculate Specific Modulus (E/Density) -> MNm/kg
      if (typeof mat.youngsModulus === 'number' && typeof mat.density === 'number' && mat.density !== 0) {
        processedMat.specificModulus = (mat.youngsModulus / mat.density) / 1e6;
      }
      return processedMat;
    });
  }, [materials]);

  // 2. Normalize data for each property (0-100 scale)
  const normalizedData = React.useMemo(() => {
    // Structure for Recharts: Array of objects, each object is an axis point (subject)
    // Keys within the object are the different materials (series)
    const dataForChart: { subject: string, [materialName: string]: number | string }[] = [];
    
    const mins: Record<string, number> = {};
    const maxs: Record<string, number> = {};

    // Find min/max for each property across all processed materials
    radarProperties.forEach(({ key }) => {
      const values = processedMaterials
        .map(mat => mat[key])
        .filter((v): v is number => typeof v === 'number'); 
      
      if (values.length > 0) {
        mins[key] = Math.min(...values);
        maxs[key] = Math.max(...values);
      } else {
        mins[key] = 0;
        maxs[key] = 1; 
      }
    });

    // Create the transposed data structure
    radarProperties.forEach(({ key, label, higherIsBetter }) => {
      const axisPoint: { subject: string, [materialName: string]: number | string } = { 
         subject: label, // The axis label
         fullMark: 100 // Recharts uses this for scaling reference
       }; 

      processedMaterials.forEach(mat => {
        const rawValue = mat[key];
        let normalizedValue = 50; // Default to middle

        if (typeof rawValue === 'number') {
          const min = mins[key];
          const max = maxs[key];
          const range = max - min;

          if (range > 0) {
            normalizedValue = ((rawValue - min) / range) * 100;
            if (!higherIsBetter) {
              normalizedValue = 100 - normalizedValue;
            }
          } else if (rawValue === min) {
             normalizedValue = higherIsBetter ? 100 : 0; 
          } 
        }
        // Use material name as the key for its value on this axis
        axisPoint[mat.name] = normalizedValue; 
      });
      dataForChart.push(axisPoint);
    });

    return dataForChart;
  }, [processedMaterials]);

  if (!materials || materials.length === 0) {
    return <p className="text-center text-gray-500">Select materials to compare.</p>;
  }
  
  if (normalizedData.length === 0) {
       return <p className="text-center text-gray-500">Not enough data to generate radar chart.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}> 
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={normalizedData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <PolarRadiusAxis 
          angle={30} 
          domain={[0, 100]} 
          axisLine={false}
          tickCount={5}
        />
        
        {materials.map((material, index) => (
          <Radar 
            key={material.id}
            name={material.name}
            dataKey={material.name}
            stroke={radarColors[index % radarColors.length]}
            fill={radarColors[index % radarColors.length]}
            fillOpacity={0.3}
          />
        ))}
        
        <Legend />
        <Tooltip 
            content={<CustomTooltip 
                        processedMaterials={processedMaterials} 
                        radarProperties={radarProperties} 
                        propertyUnitsMap={propertyUnitsMap}
                     />}
         />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, processedMaterials, radarProperties, propertyUnitsMap }: any) => {
  if (active && payload && payload.length) {
    const subjectLabel = payload[0]?.payload?.subject; // The label of the axis (e.g., 'Yield Str.')
    
    // Find the corresponding property definition - Add explicit type for p
    const radarProp = radarProperties.find((p: { key: string, label: string, higherIsBetter: boolean }) => p.label === subjectLabel);
    if (!radarProp) return null;
    const originalKey = radarProp.key as keyof Material; // Get the original data key
    const unit = propertyUnitsMap[originalKey] || '';
    
    return (
      <div className="bg-white/90 p-3 border border-gray-300 rounded shadow-lg text-sm">
        <p className="font-bold mb-1 border-b pb-1">{subjectLabel}</p>
        {payload.map((entry: any, index: number) => {
          const materialName = entry.name; // Name of the material for this radar line
          const normalizedValue = entry.value; // The 0-100 normalized value
          
          // Find the original material data
          const originalMaterial = processedMaterials.find((m: Material) => m.name === materialName);
          const originalValue = originalMaterial ? originalMaterial[originalKey] : null;
          
          // Format the original value (simple formatting for now, could be more elaborate)
          let formattedOriginalValue = 'N/A';
          if (typeof originalValue === 'number') {
             // Basic precision, might need refinement based on property
             let precision = (originalKey === 'relativeCost' || originalKey === 'density') ? 0 : 1;
             if (originalKey === 'poissonsRatio') precision = 3;
             if (originalKey === 'thermalExpansionCoefficient') formattedOriginalValue = originalValue.toExponential(2);
             else formattedOriginalValue = originalValue.toLocaleString(undefined, { 
                 minimumFractionDigits: precision, maximumFractionDigits: precision 
             });
          }
          
          return (
            <p key={`item-${index}`} style={{ color: entry.color || entry.stroke }}>
              <strong className="mr-1">{materialName}:</strong> 
              {formattedOriginalValue} {unit} 
              <span className="text-xs text-gray-500 ml-1">({normalizedValue?.toFixed(0)} norm.)</span>
            </p>
          );
        })}
      </div>
    );
  }

  return null;
}; 