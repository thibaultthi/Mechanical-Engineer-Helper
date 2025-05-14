'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Material = {
  id: string
  name: string
  density: number | null
  youngsModulus: number | null
  yieldStrength: number | null
  ultimateTensileStrength: number | null
  poissonsRatio: number | null
  shearModulus: number | null
  thermalExpansionCoefficient: number | null
  category: string | null
  createdAt: Date
  updatedAt: Date
};

type UnitInfo = {
  factor: number;
  precision: number;
}

type UnitConversionFactors = {
  [key: string]: UnitInfo;
}

// Unit conversion factors (Reverted to assume stored SI units - Pa)
const densityUnits: UnitConversionFactors = {
  'kg/m³': { factor: 1, precision: 0 },
  'g/cm³': { factor: 0.001, precision: 3 },     // 1 kg/m³ = 0.001 g/cm³
  'lb/ft³': { factor: 0.0160185, precision: 3 }, // 1 kg/m³ ≈ 0.016 lb/ft³ (Increased precision)
}

// Assumes stored value is Pascals (Pa)
const modulusUnits: UnitConversionFactors = {
  'GPa': { factor: 1e9, precision: 5 },         // 1 GPa = 1e9 Pa (Increased precision from 1 to 3)
  'MPa': { factor: 1e6, precision: 2 },         // 1 MPa = 1e6 Pa (Increased precision)
  'ksi': { factor: 6.89476e6, precision: 3 },   // 1 ksi ≈ 6.895e6 Pa (Increased precision)
  'psi': { factor: 6894.76, precision: 0 },     // 1 psi ≈ 6895 Pa
}

// Assumes stored value is Pascals (Pa)
const strengthUnits: UnitConversionFactors = {
  'GPa': { factor: 1e9, precision: 5 },        // 1 GPa = 1e9 Pa
  'MPa': { factor: 1e6, precision: 2 },        // 1 MPa = 1e6 Pa (Increased precision)
  'ksi': { factor: 6.89476e6, precision: 3 },  // 1 ksi ≈ 6.895e6 Pa (Increased precision)
  'psi': { factor: 6894.76, precision: 0 },    // 1 psi ≈ 6895 Pa
}

// Define sortable columns (match Material keys)
type SortDirection = 'asc' | 'desc';

const DEFAULT_ITEMS_PER_PAGE = 25; // Default items per page
const ITEMS_PER_PAGE_OPTIONS = [10, 15, 25, 50, 100]; // Options for items per page

// Simple color mapping for category badges (add more as needed)
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
  // Add more categories and corresponding Tailwind classes
};
const defaultCategoryColor = 'bg-slate-100 text-slate-800';

// Define columns configuration
const columns = [
  { key: 'select', label: '', minWidth: 50, sortable: false },
  { key: 'name', label: 'Material', minWidth: 250, sortable: true },
  { key: 'category', label: 'Category', minWidth: 120, sortable: true },
  { key: 'density', label: 'Density', minWidth: 100, sortable: true, unitKey: 'density' as const },
  { key: 'youngsModulus', label: 'Young\'s Modulus', minWidth: 120, sortable: true, unitKey: 'modulus' as const },
  { key: 'yieldStrength', label: 'Yield Strength', minWidth: 120, sortable: true, unitKey: 'strength' as const },
  { key: 'ultimateTensileStrength', label: 'Ultimate Strength', minWidth: 120, sortable: true, unitKey: 'strength' as const },
  { key: 'poissonsRatio', label: 'Poisson\'s Ratio', minWidth: 100, sortable: true },
  { key: 'shearModulus', label: 'Shear Modulus', minWidth: 120, sortable: true, unitKey: 'modulus' as const },
  { key: 'thermalExpansionCoefficient', label: 'Thermal Expansion', minWidth: 120, sortable: true },
] as const; // Use 'as const' for stricter typing of keys

type ColumnKey = typeof columns[number]['key'];
// Derive SortableColumn from columns config, excluding non-sortable ones
type SortableColumn = Extract<typeof columns[number], { sortable: true }>['key']; 

// Type for column widths state
type ColumnWidths = Record<ColumnKey, number>;

const LOCALSTORAGE_KEY_WIDTHS = 'materialTableColumnWidths';
const LOCALSTORAGE_KEY_ITEMS_PER_PAGE = 'materialTableItemsPerPage'; // Key for items per page

// Define Props to include the initial filter hint
interface MaterialsTableProps {
  initialMaterials?: Material[]; // Make optional or provide default
  initialCategoryFilter?: string;
}

export default function MaterialsTable({ 
  initialMaterials = [], 
  initialCategoryFilter 
}: MaterialsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUnits, setSelectedUnits] = useState({
    density: 'kg/m³',
    modulus: 'GPa',
    strength: 'MPa',
  })
  const [sortColumn, setSortColumn] = useState<SortableColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1); // Add state for current page
  const [itemsPerPage, setItemsPerPage] = useState<number>(DEFAULT_ITEMS_PER_PAGE);
  // Initialize category state with the prop, defaulting to 'all'
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryFilter || 'all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // State for selected material IDs
  const router = useRouter(); // Initialize useRouter
  const MAX_COMPARE_ITEMS = 6; // Limit comparison items
  
  // State for column widths
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
     // Default widths if nothing saved or error
     const defaults: Partial<ColumnWidths> = {};
     columns.forEach(col => { defaults[col.key] = col.minWidth; });
     return defaults as ColumnWidths;
  });

  // State for tracking resizing
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<ColumnKey | null>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const tableRef = useRef<HTMLTableElement>(null); // Ref for table element

  // Effect to load values from localStorage after mounting (client-side only)
  useEffect(() => {
    // Load items per page
    try {
      const savedItems = localStorage.getItem(LOCALSTORAGE_KEY_ITEMS_PER_PAGE);
      if (savedItems) {
        const parsedItems = parseInt(savedItems, 10);
        if (ITEMS_PER_PAGE_OPTIONS.includes(parsedItems)) {
          setItemsPerPage(parsedItems);
        }
      }
    } catch (error) {
      console.error("Failed to load items per page from localStorage:", error);
    }

    // Load column widths
    try {
      const savedWidths = localStorage.getItem(LOCALSTORAGE_KEY_WIDTHS);
      if (savedWidths) {
        const parsed = JSON.parse(savedWidths);
        // Validate parsed widths against columns
        const initial: Partial<ColumnWidths> = {};
        let updated = false;
        columns.forEach(col => {
          if (parsed[col.key] && typeof parsed[col.key] === 'number') {
            initial[col.key] = Math.max(col.minWidth, parsed[col.key]); // Ensure minWidth
            updated = true;
          } else {
            // Keep existing default width if not found in localStorage
            initial[col.key] = columnWidths[col.key]; 
          }
        });
        if (updated) {
           setColumnWidths(initial as ColumnWidths); 
        }
      }
    } catch (error) {
      console.error("Failed to load column widths from localStorage:", error);
    }
    // Run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save widths to localStorage whenever they change
  useEffect(() => {
     try {
        localStorage.setItem(LOCALSTORAGE_KEY_WIDTHS, JSON.stringify(columnWidths));
     } catch (error) {
        console.error("Failed to save column widths:", error);
     }
  }, [columnWidths]);

  // Save itemsPerPage to localStorage whenever it changes
  useEffect(() => {
     try {
        localStorage.setItem(LOCALSTORAGE_KEY_ITEMS_PER_PAGE, String(itemsPerPage));
     } catch (error) {
        console.error("Failed to save items per page:", error);
     }
  }, [itemsPerPage]);

  // Handle mouse down on resizer
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>, columnKey: ColumnKey) => {
    setIsResizing(true);
    setResizingColumn(columnKey);
    startX.current = event.clientX;
    startWidth.current = columnWidths[columnKey] || columns.find(c => c.key === columnKey)!.minWidth;
    event.preventDefault(); // Prevent text selection
  }, [columnWidths]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isResizing || !resizingColumn) return;

    const currentX = event.clientX;
    const deltaX = currentX - startX.current;
    const newWidth = startWidth.current + deltaX;
    const columnConfig = columns.find(c => c.key === resizingColumn)!;

    // Apply minimum width constraint
    const constrainedWidth = Math.max(columnConfig.minWidth, newWidth);

    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: constrainedWidth,
    }));
  }, [isResizing, resizingColumn]);

  // Handle mouse up to stop resize
  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      setResizingColumn(null);
      // Recalculate layout or potentially save final widths here
    }
  }, [isResizing]);

  // Add/Remove global listeners for mousemove and mouseup
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleUnitChange = (field: 'density' | 'modulus' | 'strength', value: string) => {
    setSelectedUnits(prev => ({ ...prev, [field]: value }))
  }

  const convertValue = (value: number | null, unitType: 'density' | 'modulus' | 'strength') => {
    if (value === null) return 'N/A';
 
    // Raw values are in SI: density in kg/m³, modulus & strength in Pa
    const siValue = value;
 
    const conversionFactors = {
      density: densityUnits,
      modulus: modulusUnits,
      strength: strengthUnits,
    };
    const unitInfo = conversionFactors[unitType][selectedUnits[unitType] as keyof typeof conversionFactors[typeof unitType]];
 
    // Divide SI value by the chosen unit's factor
    const converted = siValue / unitInfo.factor;
 
    return converted.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: unitInfo.precision,
    });
  }

  const handleSort = (column: SortableColumn) => {
    if (!columns.find(c => c.key === column)?.sortable) return; // Ignore non-sortable
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  // Get unique categories from initialMaterials
  const categories = useMemo(() => {
    const uniqueCategories = new Set(initialMaterials.map(m => m.category || 'Uncategorized').filter(Boolean));
    return ['all', ...Array.from(uniqueCategories).sort()];
  }, [initialMaterials]);

  const sortedMaterials = useMemo(() => {
    const filtered = initialMaterials.filter(material => {
        const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryValue = material.category || 'Uncategorized'; // Handle null categories
        const matchesCategory = selectedCategory === 'all' || categoryValue === selectedCategory;
        return matchesSearch && matchesCategory;
      }
    );

    // Ensure sortColumn is a valid key of Material
    const safeSortColumn = sortColumn as keyof Material;

    return [...filtered].sort((a, b) => {
      const aValue = a[safeSortColumn];
      const bValue = b[safeSortColumn];

      // Handle nulls: nulls go last when ascending, first when descending
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue === null) return sortDirection === 'asc' ? -1 : 1;

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } // Add other type checks if needed

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [initialMaterials, searchTerm, sortColumn, sortDirection, selectedCategory]); // Added selectedCategory dependency

  // Calculate pagination variables
  const totalItems = sortedMaterials.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMaterials = sortedMaterials.slice(startIndex, endIndex);

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  // Toggle selection of a material
  const handleSelectMaterial = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : prev.length < MAX_COMPARE_ITEMS // Only add if below limit
        ? [...prev, id]
        : prev // Otherwise, do nothing (or show a message)
    );
  };

  // Navigate to comparison page
  const handleCompare = () => {
    if (selectedIds.length > 0) {
      const query = selectedIds.join(',');
      router.push(`/materials/compare?ids=${query}`);
    }
  };

  const exportToCSV = () => {
    // Use sortedMaterials for CSV export
    const headers = ['Name', 'Category', `Density (${selectedUnits.density})`, `Young's Modulus (${selectedUnits.modulus})`, `Yield Strength (${selectedUnits.strength})`, `Ultimate Tensile Strength (${selectedUnits.strength})`, "Poisson's Ratio", `Shear Modulus (${selectedUnits.modulus})`, `Thermal Expansion Coefficient (1/°C)`]
    const csvContent = [
      headers.join(','),
      ...sortedMaterials.map(material => [
        material.name,
        material.category || 'Uncategorized',
        convertValue(material.density, 'density'),
        convertValue(material.youngsModulus, 'modulus'),
        convertValue(material.yieldStrength, 'strength'),
        convertValue(material.ultimateTensileStrength, 'strength'),
        material.poissonsRatio?.toFixed(3) || 'N/A',
        convertValue(material.shearModulus, 'modulus'),
        material.thermalExpansionCoefficient?.toExponential(2) || 'N/A' // Use exponential for small coeffs
      ].map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')) // Handle quotes in values
    ].join('\n')

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'materials_data.csv' // Changed filename slightly
    link.click()
  }

  // Helper to render sort icon
  const SortIcon = ({ column }: { column: SortableColumn }) => {
    const isSortable = columns.find(c => c.key === column)?.sortable;
    if (!isSortable) return null; 
    if (sortColumn !== column) return <span className="ml-1 opacity-30">↕</span>;
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  // Handle change in items per page selection
  const handleItemsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newItemsPerPage = parseInt(event.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, itemsPerPage]);

  return (
    <div className={`p-6 ${isResizing ? 'cursor-col-resize select-none' : ''}`}> 
      {/* Controls Section (Always Visible) */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search & Category Filter */} 
          <div className="flex flex-col sm:flex-row gap-4 flex-grow">
            <div className="relative flex-grow max-w-xs"> {/* Reduced max width */}
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} // Reset page on search
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm" // Made text smaller
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
             <div className="flex-shrink-0">
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }} // Reset page on filter change
                className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-2 pl-2 pr-7" // Adjusted padding
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Compare Button */}
          <div className="flex-shrink-0">
            <button
              onClick={handleCompare}
              disabled={selectedIds.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Compare Selected ({selectedIds.length})
            </button>
            {selectedIds.length === MAX_COMPARE_ITEMS && (
              <p className="text-xs text-red-600 mt-1">Max {MAX_COMPARE_ITEMS} items</p>
            )}
          </div>

          {/* Unit Controls & Export */} 
          <div className="flex flex-wrap items-center gap-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Density</label>
              <select
                value={selectedUnits.density}
                onChange={(e) => handleUnitChange('density', e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-1.5 pl-2 pr-7"
              >
                {Object.keys(densityUnits).map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Modulus</label>
              <select
                value={selectedUnits.modulus}
                onChange={(e) => handleUnitChange('modulus', e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-1.5 pl-2 pr-7"
              >
                {Object.keys(modulusUnits).map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Strength</label>
              <select
                value={selectedUnits.strength}
                onChange={(e) => handleUnitChange('strength', e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-1.5 pl-2 pr-7"
              >
                {Object.keys(strengthUnits).map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <svg className="h-5 w-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table Layout (Desktop - md and up) */}
      <div className="hidden md:block">
         <div className="overflow-x-auto shadow-sm border border-gray-200 rounded-lg">
           <table ref={tableRef} className="w-full divide-y divide-gray-200 table-fixed">
              <thead>
                <tr className="bg-gray-50">
                  {columns.map((col, index) => {
                      // Type guard for unitKey
                      const hasUnitKey = (c: typeof col): c is Extract<typeof col, { unitKey: 'density' | 'modulus' | 'strength' }> => {
                        return 'unitKey' in c && c.unitKey !== undefined;
                      }
                      
                      // Determine responsive classes
                      let responsiveClasses = '';
                      if (col.key === 'poissonsRatio' || col.key === 'shearModulus') {
                        responsiveClasses = 'hidden md:table-cell'; // Hide below md breakpoint
                      }
                      
                      return (
                        <th
                          key={col.key}
                          scope="col"
                          className={`relative px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.key === 'select' ? 'text-center' : ''} ${responsiveClasses}`}
                          style={{ width: `${columnWidths[col.key]}px` }}
                        >
                          <button 
                             onClick={() => col.sortable && handleSort(col.key as SortableColumn)} 
                             className={`flex items-center w-full ${col.sortable ? 'cursor-pointer' : 'cursor-default'}`}
                             disabled={!col.sortable}
                          >
                            {col.label}
                            {hasUnitKey(col) && ` (${selectedUnits[col.unitKey]})`}
                            {col.sortable && <SortIcon column={col.key as SortableColumn} />} 
                          </button>
                          
                          {/* Resizer Handle */}
                          {index < columns.length - 1 && (
                            <div 
                              onMouseDown={(e) => handleMouseDown(e, col.key)}
                              className="absolute top-0 right-0 h-full w-0.5 cursor-col-resize bg-gray-300 hover:bg-blue-500 opacity-50 hover:opacity-100 z-10"
                               style={{ transform: 'translateX(50%)' }} 
                            />
                          )}
                        </th>
                      )
                  })}
                </tr>
              </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {paginatedMaterials.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10.5a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z"
                            />
                          </svg>
                          <p className="mt-1 text-lg font-medium text-gray-900">
                            {searchTerm || selectedCategory !== 'all' ? 'No materials found' : 'No materials available'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {searchTerm || selectedCategory !== 'all' ? 'Try adjusting your search or filter.' : 'Materials will appear here once added.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                ) : (
                  paginatedMaterials.map((material) => {
                     const isSelected = selectedIds.includes(material.id);
                     const canSelectMore = selectedIds.length < MAX_COMPARE_ITEMS;
                     return (
                      <tr
                        key={material.id}
                        className={`${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'} transition-colors duration-150 ease-in-out`}
                      >
                        {columns.map(col => {
                           let cellContent: React.ReactNode;
                           switch (col.key) {
                             case 'select':
                               cellContent = (
                                 <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectMaterial(material.id)}
                                    disabled={!isSelected && !canSelectMore}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50 mx-auto block"
                                  />
                               );
                               break;
                             case 'name':
                               cellContent = material.name;
                               break;
                             case 'category':
                               const category = material.category || 'Uncategorized';
                               const categoryClasses = categoryColorMap[category] || defaultCategoryColor;
                               cellContent = (
                                 <span 
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryClasses}`}
                                  >
                                    {category}
                                  </span>
                               );
                               break;
                             case 'poissonsRatio':
                               cellContent = material.poissonsRatio?.toFixed(3) || 'N/A';
                               break;
                               case 'thermalExpansionCoefficient':
                                 cellContent = material.thermalExpansionCoefficient?.toExponential(2) || 'N/A';
                                 break;
                             case 'density':
                             case 'youngsModulus':
                             case 'yieldStrength':
                             case 'ultimateTensileStrength':
                             case 'shearModulus':
                               // Explicitly cast material[col.key] as it should be number | null here
                               const value = material[col.key] as number | null;
                               // Safely get unitKey 
                               const unitKey = col.unitKey as 'density' | 'modulus' | 'strength';
                               cellContent = convertValue(value, unitKey);
                               break;
                             default:
                               // Should not happen with defined columns, but provide fallback
                               cellContent = 'Error'; 
                           }
                           
                           // Determine text alignment based on content type or column key
                           let textAlign: 'left' | 'right' | 'center' = 'left';
                           if (col.key === 'select') {
                             textAlign = 'center';
                           } else if (typeof material[col.key as keyof Material] === 'number' || 
                                      [ 'density', 'youngsModulus', 'yieldStrength', 'ultimateTensileStrength', 'poissonsRatio', 'shearModulus', 'thermalExpansionCoefficient'].includes(col.key)) {
                              if (material[col.key as keyof Material] !== null) { // Only right-align if not N/A
                                 textAlign = 'right';
                              }
                           }

                           // Determine responsive classes (must match header)
                           let responsiveClasses = '';
                           if (col.key === 'poissonsRatio' || col.key === 'shearModulus') {
                             responsiveClasses = 'hidden md:table-cell'; // Hide below md breakpoint
                           }

                           return (
                             <td 
                               key={`${material.id}-${col.key}`}
                               className={`px-4 py-3 whitespace-nowrap text-sm overflow-hidden text-ellipsis ${responsiveClasses}`}
                               style={{ 
                                 width: `${columnWidths[col.key]}px`, 
                                 textAlign: textAlign,
                               }}
                             >
                               {cellContent}
                             </td>
                           );
                        })}
                      </tr>
                    )
                  })
                )}
              </tbody>
           </table>
         </div>
      </div>

      {/* Card Layout (Mobile - below md) */}
      <div className="block md:hidden space-y-4">
        {paginatedMaterials.length === 0 ? (
          <div className="text-center py-12">
             {/* ... Empty state SVG and text ... */}
             <p className="mt-1 text-lg font-medium text-gray-900">
               {searchTerm || selectedCategory !== 'all' ? 'No materials found' : 'No materials available'}
             </p>
             <p className="mt-1 text-sm text-gray-500">
               {searchTerm || selectedCategory !== 'all' ? 'Try adjusting your search or filter.' : 'Materials will appear here once added.'}
             </p>
          </div>
        ) : (
          paginatedMaterials.map((material) => {
            const isSelected = selectedIds.includes(material.id);
            const canSelectMore = selectedIds.length < MAX_COMPARE_ITEMS;
            const category = material.category || 'Uncategorized';
            const categoryClasses = categoryColorMap[category] || defaultCategoryColor;

            return (
              <div key={material.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
                {/* ... Card content (Name, Checkbox, Properties Grid) ... */} 
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="text-base font-semibold text-gray-900 mr-2">{material.name}</h3>
                   <input
                     type="checkbox"
                     checked={isSelected}
                     onChange={() => handleSelectMaterial(material.id)}
                     disabled={!isSelected && !canSelectMore}
                     className="flex-shrink-0 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-offset-0 focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50"
                     aria-label={`Compare ${material.name}`}
                   />
                 </div>
                 <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                   {/* Column 1 */}
                   <div>
                      <span 
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${categoryClasses}`}
                      >
                        {category}
                      </span>
                      <p className="text-gray-500">Density: <span className="font-medium text-gray-700">{convertValue(material.density, 'density')} {selectedUnits.density}</span></p>
                      <p className="text-gray-500">Yield Str: <span className="font-medium text-gray-700">{convertValue(material.yieldStrength, 'strength')} {selectedUnits.strength}</span></p>
                   </div>
                   {/* Column 2 */}
                   <div>
                      <p className="text-gray-500">E Modulus: <span className="font-medium text-gray-700">{convertValue(material.youngsModulus, 'modulus')} {selectedUnits.modulus}</span></p>
                      <p className="text-gray-500">UTS: <span className="font-medium text-gray-700">{convertValue(material.ultimateTensileStrength, 'strength')} {selectedUnits.strength}</span></p>
                   </div>
                 </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer with Pagination (Always Visible & FULLY INCLUDED) */}
      <div className="mt-5 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 gap-4">
        {/* Items per page selector */}
        <div className="flex items-center space-x-2 order-1 sm:order-none">
          <label htmlFor="itemsPerPageSelect" className="whitespace-nowrap">Items per page:</label>
          <select
            id="itemsPerPageSelect"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 py-1 pl-2 pr-7"
          >
            {ITEMS_PER_PAGE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Showing X-Y of Z */}
        <div className="order-3 sm:order-none">
          Showing {totalItems > 0 ? startIndex + 1 : 0} - {Math.min(endIndex, totalItems)} of {totalItems} materials
        </div>

        {/* Pagination Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2 order-2 sm:order-none">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 