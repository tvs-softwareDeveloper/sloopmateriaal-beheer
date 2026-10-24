import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
};

type LanguageProviderProps = {
  children: ReactNode;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const translations: Record<string, Record<string, string>> = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    materials: 'Materials',
    logout: 'Logout',
    appName: 'Reclaimed Materials',
    appSubtitle: 'Material Management',
    
    // Dashboard
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'Overview of your reclaimed materials inventory',
    viewAllMaterials: 'View All Materials',
    totalMaterials: 'Total Materials',
    available: 'Available',
    forSale: 'For Sale',
    forReuse: 'For Reuse',
    forDisposal: 'For Disposal',
    sold: 'Sold',
    inventoryValue: 'Inventory Value',
    revenueSold: 'Revenue (Sold)',
    recentlyAdded: 'Recently Added',
    attentionRequired: 'Attention Required',
    allItemsGood: 'All items are in good shape!',
    noMaterialsYet: 'No materials yet',
    poorCondition: 'Poor condition',
    pendingDisposal: 'Pending disposal',
    review: 'Review',
    moreItems: 'more items',
    viewAll: 'View all',
    
    // Charts
    statusDistribution: 'Status Distribution',
    materialsByType: 'Materials by Type',
    conditionBreakdown: 'Condition Breakdown',
    inventoryValueByType: 'Inventory Value by Type',
    items: 'Items',
    value: 'Value',
    
    // Materials page
    materialsTitle: 'Materials',
    ofItems: 'of',
    scanQR: 'Scan QR',
    export: 'Export',
    select: 'Select',
    cancelSelection: 'Cancel Selection',
    addMaterial: 'Add Material',
    selected: 'selected',
    selectAll: 'Select All',
    deselectAll: 'Deselect All',
    bulkUpdate: 'Bulk Update',
    deleteSelected: 'Delete Selected',
    noMaterialsFound: 'No materials found',
    getStarted: 'Get started by adding your first material',
    tryAdjustingFilters: 'Try adjusting your filters',
    
    // Filters
    searchMaterials: 'Search materials on name, type, location...',
    allStatuses: 'All Statuses',
    allTypes: 'All Types',
    allConditions: 'All Conditions',
    filters: 'Filters',
    filterMaterials: 'Filter Materials',
    materialType: 'Material Type',
    status: 'Status',
    condition: 'Condition',
    clearAllFilters: 'Clear All Filters',
    clearAll: 'Clear all',
    newestFirst: 'Newest First',
    oldestFirst: 'Oldest First',
    nameAZ: 'Name (A-Z)',
    nameZA: 'Name (Z-A)',
    quantityHighLow: 'Quantity (High-Low)',
    quantityLowHigh: 'Quantity (Low-High)',
    priceHighLow: 'Price (High-Low)',
    priceLowHigh: 'Price (Low-High)',
    search: 'Search',
    type: 'Type',
    
    // Material types
    wood: 'Wood',
    metal: 'Metal',
    concrete: 'Concrete',
    brick: 'Brick',
    glass: 'Glass',
    fixtures: 'Fixtures',
    appliances: 'Appliances',
    roofing: 'Roofing',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    other: 'Other',
    
    // Statuses (keys match the status values in the database)
    reserved: 'Reserved',
    disposed: 'Disposed',
    recycled: 'Recycled',
    for_sale: 'For Sale',
    for_reuse: 'For Reuse',
    for_disposal: 'For Disposal',
    unknown: 'Unknown',
    count: 'Count',

    
    // Conditions
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    
    // Form
    editMaterial: 'Edit Material',
    addNewMaterial: 'Add New Material',
    materialName: 'Material Name',
    materialNamePlaceholder: 'e.g., Oak Flooring Planks',
    quantity: 'Quantity',
    unit: 'Unit',
    price: 'Price',
    location: 'Location',
    locationPlaceholder: 'e.g., Warehouse A, Bay 3',
    projectName: 'Project Name',
    projectNamePlaceholder: 'e.g., Downtown Office Demolition',
    notes: 'Notes',
    notesPlaceholder: 'Additional details about the material...',
    cancel: 'Cancel',
    updateMaterial: 'Update Material',
    
    // Units
    pieces: 'Pieces',
    kilograms: 'Kilograms (kg)',
    pounds: 'Pounds (lbs)',
    squareFeet: 'Square Feet',
    squareMeters: 'Square Meters',
    linearFeet: 'Linear Feet',
    linearMeters: 'Linear Meters',
    pallets: 'Pallets',
    boxes: 'Boxes',

    // Short units next to a quantity (keys match the unit values in the database)
    unit_pieces: 'pieces',
    unit_kg: 'kg',
    unit_lbs: 'lbs',
    unit_sqft: 'sq ft',
    unit_sqm: 'm²',
    unit_linear_ft: 'ft',
    unit_linear_m: 'm',
    unit_pallets: 'pallets',
    unit_boxes: 'boxes',

    // QR
    qrCode: 'QR Code',
    copy: 'Copy',
    download: 'Download',
    print: 'Print',
    scanQRCode: 'Scan QR Code',
    startCamera: 'Start Camera',
    cameraPreview: 'Camera preview',
    orEnterManually: 'or enter code manually',
    enterMaterialCode: 'Enter material code...',
    simulateScan: 'Simulate Scan (Demo)',
    
    // Bulk update
    bulkUpdateMaterials: 'Bulk Update Materials',
    bulkUpdateWarning: 'You are about to update',
    onlyFilledFields: 'Only filled fields will be updated.',
    updateStatus: 'Update Status',
    updateCondition: 'Update Condition',
    updateLocation: 'Update Location',
    updateProjectName: 'Update Project Name',
    noChange: 'No change',
    leaveEmpty: 'Leave empty for no change',
    updateItems: 'Update',
    
    // Delete
    deleteMaterial: 'Delete Material',
    deleteConfirmation: 'Are you sure you want to delete',
    cannotBeUndone: 'This action cannot be undone.',
    delete: 'Delete',
    
    // Export
    exportAsCSV: 'Export as CSV',
    exportAsExcel: 'Export as Excel',
    exportAsJSON: 'Export as JSON',
    
    // Messages
    materialAdded: 'Material added successfully',
    materialUpdated: 'Material updated',
    materialDeleted: 'Material deleted',
    materialsUpdated: 'materials updated',
    materialsDeleted: 'materials deleted',
    exported: 'Exported',
    materialsTo: 'materials to',
    codeCopied: 'Code copied to clipboard',
    qrDownloaded: 'QR code downloaded',
    found: 'Found',
    materialNotFound: 'Material not found with this code',
    pleaseEnterCode: 'Please enter a code',
    cameraStarted: 'Camera started. Point at a QR code to scan.',
    couldNotAccessCamera: 'Could not access camera. Please enter code manually.',
    scanned: 'Scanned',
    failedToExport: 'Failed to export',
    failedToUpdate: 'Failed to update materials',
    failedToDelete: 'Failed to delete materials',

    // Language
    language: 'Language',
    english: 'English',
    dutch: 'Dutch',

    // Currency
    currencySymbol: '$',
    },
  nl: {
    // Navigation
    dashboard: 'Dashboard',
    materials: 'Materialen',
    logout: 'Uitloggen',
    appName: 'Sloopmateriaal',
    appSubtitle: 'Materiaalbeheer',
    
    // Dashboard
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'Overzicht van uw gerecycleerde materialen inventaris',
    viewAllMaterials: 'Bekijk Alle Materialen',
    totalMaterials: 'Totaal Materialen',
    available: 'Beschikbaar',
    forSale: 'Te Koop',
    forReuse: 'Voor Hergebruik',
    forDisposal: 'Voor Afvoer',
    sold: 'Verkocht',
    inventoryValue: 'Voorraadwaarde',
    revenueSold: 'Omzet (Verkocht)',
    recentlyAdded: 'Recent Toegevoegd',
    attentionRequired: 'Aandacht Vereist',
    allItemsGood: 'Alle items zijn in goede staat!',
    noMaterialsYet: 'Nog geen materialen',
    poorCondition: 'Slechte conditie',
    pendingDisposal: 'Wacht op afvoer',
    review: 'Bekijken',
    moreItems: 'meer items',
    viewAll: 'Bekijk alles',
    
    // Charts
    statusDistribution: 'Status Verdeling',
    materialsByType: 'Materialen per Type',
    conditionBreakdown: 'Conditie Overzicht',
    inventoryValueByType: 'Voorraadwaarde per Type',
    items: 'Items',
    value: 'Waarde',
    
    // Materials page
    materialsTitle: 'Materialen',
    ofItems: 'van',
    scanQR: 'Scan QR',
    export: 'Exporteren',
    select: 'Selecteren',
    cancelSelection: 'Selectie Annuleren',
    addMaterial: 'Materiaal Toevoegen',
    selected: 'geselecteerd',
    selectAll: 'Alles Selecteren',
    deselectAll: 'Deselecteer Alles',
    bulkUpdate: 'Bulk Bijwerken',
    deleteSelected: 'Verwijder Geselecteerde',
    noMaterialsFound: 'Geen materialen gevonden',
    getStarted: 'Begin met het toevoegen van uw eerste materiaal',
    tryAdjustingFilters: 'Probeer de filters aan te passen',
    
    // Filters
    searchMaterials: 'Zoek materialen op naam, type, locatie...',
    allStatuses: 'Alle Statussen',
    allTypes: 'Alle Types',
    allConditions: 'Alle Condities',
    filters: 'Filters',
    filterMaterials: 'Filter Materialen',
    materialType: 'Materiaaltype',
    status: 'Status',
    condition: 'Conditie',
    clearAllFilters: 'Wis Alle Filters',
    clearAll: 'Wis alles',
    newestFirst: 'Nieuwste Eerst',
    oldestFirst: 'Oudste Eerst',
    nameAZ: 'Naam (A-Z)',
    nameZA: 'Naam (Z-A)',
    quantityHighLow: 'Hoeveelheid (Hoog-Laag)',
    quantityLowHigh: 'Hoeveelheid (Laag-Hoog)',
    priceHighLow: 'Prijs (Hoog-Laag)',
    priceLowHigh: 'Prijs (Laag-Hoog)',
    search: 'Zoeken',
    type: 'Type',
    
    // Material types
    wood: 'Hout',
    metal: 'Metaal',
    concrete: 'Beton',
    brick: 'Baksteen',
    glass: 'Glas',
    fixtures: 'Armaturen',
    appliances: 'Apparaten',
    roofing: 'Dakbedekking',
    plumbing: 'Loodgieterswerk',
    electrical: 'Elektrisch',
    other: 'Overig',
    
    // Statuses (keys match the status values in the database)
    reserved: 'Gereserveerd',
    disposed: 'Afgevoerd',
    recycled: 'Gerecycled',
    for_sale: 'Te Koop',
    for_reuse: 'Voor Hergebruik',
    for_disposal: 'Voor Afvoer',
    unknown: 'Onbekend',
    count: 'Aantal',

    // Conditions
    excellent: 'Uitstekend',
    good: 'Goed',
    fair: 'Redelijk',
    poor: 'Slecht',
    
    // Form
    editMaterial: 'Materiaal Bewerken',
    addNewMaterial: 'Nieuw Materiaal Toevoegen',
    materialName: 'Materiaalnaam',
    materialNamePlaceholder: 'bijv. Eiken Vloerplanken',
    quantity: 'Hoeveelheid',
    unit: 'Eenheid',
    price: 'Prijs',
    location: 'Locatie',
    locationPlaceholder: 'bijv. Magazijn A, Vak 3',
    projectName: 'Projectnaam',
    projectNamePlaceholder: 'bijv. Sloop Kantoorgebouw',
    notes: 'Notities',
    notesPlaceholder: 'Extra details over het materiaal...',
    cancel: 'Annuleren',
    updateMaterial: 'Materiaal Bijwerken',
    
    // Units
    pieces: 'Stuks',
    kilograms: 'Kilogram (kg)',
    pounds: 'Pond (lbs)',
    squareFeet: 'Vierkante Voet',
    squareMeters: 'Vierkante Meter',
    linearFeet: 'Lopende Voet',
    linearMeters: 'Lopende Meter',
    pallets: 'Pallets',
    boxes: 'Dozen',

    // Short units next to a quantity
    unit_pieces: 'stuks',
    unit_kg: 'kg',
    unit_lbs: 'lbs',
    unit_sqft: 'sq ft',
    unit_sqm: 'm²',
    unit_linear_ft: 'ft',
    unit_linear_m: 'm',
    unit_pallets: 'pallets',
    unit_boxes: 'dozen',

    // QR
    qrCode: 'QR Code',
    copy: 'Kopiëren',
    download: 'Downloaden',
    print: 'Afdrukken',
    scanQRCode: 'Scan QR Code',
    startCamera: 'Start Camera',
    cameraPreview: 'Camera voorbeeld',
    orEnterManually: 'of voer code handmatig in',
    enterMaterialCode: 'Voer materiaalcode in...',
    simulateScan: 'Simuleer Scan (Demo)',
    
    // Bulk update
    bulkUpdateMaterials: 'Materialen Bulk Bijwerken',
    bulkUpdateWarning: 'U staat op het punt om bij te werken',
    onlyFilledFields: 'Alleen ingevulde velden worden bijgewerkt.',
    updateStatus: 'Status Bijwerken',
    updateCondition: 'Conditie Bijwerken',
    updateLocation: 'Locatie Bijwerken',
    updateProjectName: 'Projectnaam Bijwerken',
    noChange: 'Geen wijziging',
    leaveEmpty: 'Laat leeg voor geen wijziging',
    updateItems: 'Bijwerken',
    
    // Delete
    deleteMaterial: 'Materiaal Verwijderen',
    deleteConfirmation: 'Weet u zeker dat u wilt verwijderen',
    cannotBeUndone: 'Deze actie kan niet ongedaan worden gemaakt.',
    delete: 'Verwijderen',
    
    // Export
    exportAsCSV: 'Exporteren als CSV',
    exportAsExcel: 'Exporteren als Excel',
    exportAsJSON: 'Exporteren als JSON',
    
    // Messages
    materialAdded: 'Materiaal succesvol toegevoegd',
    materialUpdated: 'Materiaal bijgewerkt',
    materialDeleted: 'Materiaal verwijderd',
    materialsUpdated: 'materialen bijgewerkt',
    materialsDeleted: 'materialen verwijderd',
    exported: 'Geëxporteerd',
    materialsTo: 'materialen naar',
    codeCopied: 'Code gekopieerd naar klembord',
    qrDownloaded: 'QR code gedownload',
    found: 'Gevonden',
    materialNotFound: 'Materiaal niet gevonden met deze code',
    pleaseEnterCode: 'Voer een code in',
    cameraStarted: 'Camera gestart. Richt op een QR code om te scannen.',
    couldNotAccessCamera: 'Kon geen toegang krijgen tot camera. Voer code handmatig in.',
    scanned: 'Gescand',
    failedToExport: 'Exporteren mislukt',
    failedToUpdate: 'Bijwerken van materialen mislukt',
    failedToDelete: 'Verwijderen van materialen mislukt',

    // Language
    language: 'Taal',
    english: 'Engels',
    dutch: 'Nederlands',

    // Currency
    currencySymbol: '€',
    }
    };


export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('app_language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}