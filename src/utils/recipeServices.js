import {
  DEFAULT_SERVINGS,
  generateId,
  inferDietGroup,
  scaleIngredients,
  formatAmount,
} from '../data/initialData.js';

// ============================================================================
// 1. BUSCADOR DE RECETAS EN INTERNET (TheMealDB + Catálogo Online Español)
// ============================================================================

const ES_TO_EN_SEARCH_MAP = {
  pollo: 'chicken',
  pavo: 'turkey',
  pescado: 'fish',
  salmon: 'salmon',
  salmón: 'salmon',
  merluza: 'cod',
  bacalao: 'cod',
  atun: 'tuna',
  atún: 'tuna',
  dorada: 'sea bream',
  lentejas: 'lentil',
  garbanzos: 'chickpea',
  alubias: 'bean',
  judias: 'bean',
  judías: 'bean',
  legumbres: 'lentil',
  verduras: 'vegetable',
  verdura: 'vegetable',
  ensalada: 'salad',
  espinacas: 'spinach',
  calabacin: 'courgette',
  calabacín: 'courgette',
  pasta: 'pasta',
  arroz: 'rice',
  huevo: 'egg',
  huevos: 'egg',
  sopa: 'soup',
  crema: 'soup',
  patata: 'potato',
  patatas: 'potato',
};

const DIET_GROUP_FALLBACK_TERMS = {
  legumbres: ['lentil', 'chickpea', 'bean'],
  verduras: ['vegetable', 'salad', 'spinach'],
  pescado: ['salmon', 'cod', 'tuna'],
  carnes_blancas: ['chicken', 'turkey'],
  all: ['salmon', 'lentil', 'chicken', 'vegetable'],
};

const ONLINE_SPANISH_RECIPES_DB = [
  {
    id: 'online_es_garbanzos_bacalao',
    name: 'Potaje de garbanzos con bacalao y espinacas',
    mealCategory: 'comida',
    dietGroup: 'legumbres',
    prepTime: 30,
    servings: 2,
    description: 'Receta tradicional de legumbres y pescado blanco desalado, muy equilibrada para 2 personas.',
    sourceLabel: 'Recetario Mediterráneo Online',
    steps: [
      'Pochar cebolla, ajo y tomate rallado con una pizca de pimentón.',
      'Añadir los garbanzos cocidos y cubrir ligeramente con caldo de verduras o agua.',
      'Incorporar las espinacas y el bacalao en lascas durante los últimos 5 minutos.',
    ],
    ingredients: [
      { id: 'ol1', name: 'Garbanzos cocidos', amount: 350, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'ol2', name: 'Lomos de bacalao desalado', amount: 220, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'ol3', name: 'Espinacas frescas', amount: 150, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'ol4', name: 'Cebolla', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol5', name: 'Tomate triturado', amount: 120, unit: 'g', category: 'Despensa y Cereales' },
    ],
  },
  {
    id: 'online_es_ensalada_lentejas',
    name: 'Ensalada templada de lentejas, aguacate y queso de cabra',
    mealCategory: 'comida',
    dietGroup: 'legumbres',
    prepTime: 15,
    servings: 2,
    description: 'Plato fresco de legumbres listo en 15 minutos con vinagreta de mostaza y limón.',
    sourceLabel: 'Recetario Mediterráneo Online',
    steps: [
      'Enjuagar y escurrir bien las lentejas cocidas.',
      'Mezclar con tomate cherry, pepino, aguacate en dados y brotes verdes.',
      'Aliñar con aceite de oliva, zumo de limón y queso desmenuzado.',
    ],
    ingredients: [
      { id: 'ol6', name: 'Lentejas cocidas', amount: 320, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'ol7', name: 'Aguacate', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol8', name: 'Tomates cherry', amount: 180, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'ol9', name: 'Brotes de lechuga', amount: 100, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'ol10', name: 'Queso fresco o de cabra', amount: 80, unit: 'g', category: 'Lácteos y Huevos' },
    ],
  },
  {
    id: 'online_es_lubina_papillote',
    name: 'Lubina al papillote con juliana de verduras',
    mealCategory: 'cena',
    dietGroup: 'pescado',
    prepTime: 25,
    servings: 2,
    description: 'Pescado blanco cocinado en su propio jugo con zanahoria, puerro y calabacín.',
    sourceLabel: 'Cocina Saludable Online',
    steps: [
      'Cortar el puerro, zanahoria y calabacín en tiras muy finas.',
      'Colocar sobre papel de horno la cama de verduras y encima los lomos de lubina con limón y eneldo.',
      'Cerrar el paquete herméticamente y hornear 15 minutos a 190 °C.',
    ],
    ingredients: [
      { id: 'ol11', name: 'Lomos de lubina', amount: 320, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'ol12', name: 'Zanahoria', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol13', name: 'Puerro', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol14', name: 'Calabacín', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol15', name: 'Limón', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
    ],
  },
  {
    id: 'online_es_bacalao_tomate',
    name: 'Bacalao con pisto suave de tomate y pimientos',
    mealCategory: 'comida',
    dietGroup: 'pescado',
    prepTime: 28,
    servings: 2,
    description: 'Receta marinera baja en grasa ideal para comidas o cenas ligeras para 2 personas.',
    sourceLabel: 'Cocina Saludable Online',
    steps: [
      'Cocinar cebolla y pimiento verde en tiras durante 10 minutos.',
      'Añadir tomate triturado y reducir 8 minutos con una pizca de orégano.',
      'Colocar los lomos de bacalao tapados 6 minutos hasta que las lascas se separen.',
    ],
    ingredients: [
      { id: 'ol16', name: 'Lomos de bacalao fresco', amount: 340, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'ol17', name: 'Tomate triturado', amount: 250, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'ol18', name: 'Pimiento verde', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol19', name: 'Cebolla', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
    ],
  },
  {
    id: 'online_es_brochetas_pollo',
    name: 'Brochetas de pollo y pimientos al horno con patata asada',
    mealCategory: 'comida',
    dietGroup: 'carnes_blancas',
    prepTime: 28,
    servings: 2,
    description: 'Carne blanca marinada con pimentón, limón y orégano acompañada de hortalizas.',
    sourceLabel: 'Recetario Mediterráneo Online',
    steps: [
      'Marinar los dados de pollo 10 minutos con aceite, limón, ajo en polvo y orégano.',
      'Ensartar alternando con pimiento rojo y cebolla morada.',
      'Asar 18 minutos en horno o freidora de aire junto con gajos de patata.',
    ],
    ingredients: [
      { id: 'ol20', name: 'Pechuga de pollo', amount: 300, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'ol21', name: 'Pimiento rojo', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol22', name: 'Cebolla morada', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol23', name: 'Patatas', amount: 300, unit: 'g', category: 'Frutas y Verduras' },
    ],
  },
  {
    id: 'online_es_pavo_mostaza',
    name: 'Solomillo de pavo a la plancha con judías verdes',
    mealCategory: 'cena',
    dietGroup: 'carnes_blancas',
    prepTime: 20,
    servings: 2,
    description: 'Cena alta en proteína magra con judías verdes salteadas con ajo.',
    sourceLabel: 'Cocina Saludable Online',
    steps: [
      'Cocer las judías verdes al vapor 8 minutos y saltearlas con ajo laminado.',
      'Cortar el solomillo de pavo en medallones y cocinar a la plancha 3 minutos por lado.',
      'Servir con un toque de mostaza antigua y perejil.',
    ],
    ingredients: [
      { id: 'ol24', name: 'Solomillo de pavo', amount: 320, unit: 'g', category: 'Carnes y Pescados' },
      { id: 'ol25', name: 'Judías verdes', amount: 250, unit: 'g', category: 'Frutas y Verduras' },
      { id: 'ol26', name: 'Ajo', amount: 2, unit: 'diente', category: 'Frutas y Verduras' },
      { id: 'ol27', name: 'Mostaza antigua', amount: 1, unit: 'cda', category: 'Condimentos y Otros' },
    ],
  },
  {
    id: 'online_es_berenjenas_rellenas',
    name: 'Berenjenas asadas rellenas de verduras y soja texturizada',
    mealCategory: 'cena',
    dietGroup: 'verduras',
    prepTime: 35,
    servings: 2,
    description: 'Plato vegetal sabroso gratinado ligeramente con queso mozzarella.',
    sourceLabel: 'Recetario Mediterráneo Online',
    steps: [
      'Partir las berenjenas por la mitad y hornear 20 minutos.',
      'Vaciar la pulpa y sofreír con cebolla, pimiento, tomate y soja hidratada.',
      'Rellenar, cubrir con queso rallado y gratinar 5 minutos.',
    ],
    ingredients: [
      { id: 'ol28', name: 'Berenjena', amount: 2, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol29', name: 'Tomate triturado', amount: 200, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'ol30', name: 'Cebolla', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol31', name: 'Queso rallado ligero', amount: 50, unit: 'g', category: 'Lácteos y Huevos' },
    ],
  },
  {
    id: 'online_es_pisto_huevo',
    name: 'Pisto manchego con huevo poché',
    mealCategory: 'cena',
    dietGroup: 'verduras',
    prepTime: 25,
    servings: 2,
    description: 'Clásico de verduras de huerta con huevo escalfado para una cena reconfortante.',
    sourceLabel: 'Cocina Saludable Online',
    steps: [
      'Pochar lentamente cebolla, pimiento verde, pimiento rojo y calabacín en dados.',
      'Añadir tomate natural triturado y dejar reducir 12 minutos.',
      'Servir en dos platos con un huevo poché o a la plancha encima.',
    ],
    ingredients: [
      { id: 'ol32', name: 'Calabacín', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol33', name: 'Pimiento rojo', amount: 1, unit: 'ud', category: 'Frutas y Verduras' },
      { id: 'ol34', name: 'Tomate triturado', amount: 250, unit: 'g', category: 'Despensa y Cereales' },
      { id: 'ol35', name: 'Huevo', amount: 2, unit: 'ud', category: 'Lácteos y Huevos' },
    ],
  },
];

export function categorizeIngredientName(name = '') {
  const lower = name.toLowerCase();
  if (
    /(pollo|pavo|salm[oó]n|merluza|bacalao|lubina|dorada|at[uú]n|pescado|carne|ternera|cerdo|gamba|langostino|chicken|turkey|salmon|cod|tuna|fish|beef|pork)/.test(
      lower,
    )
  ) {
    return 'Carnes y Pescados';
  }
  if (/(leche|yogur|queso|huevo|mantequilla|nata|milk|yogurt|cheese|egg|butter|cream)/.test(lower)) {
    return 'Lácteos y Huevos';
  }
  if (/(pan|tostada|baguette|hogaza|bread|bun)/.test(lower)) {
    return 'Panadería';
  }
  if (
    /(arroz|pasta|avena|lenteja|garbanzo|alubia|quinoa|cusc[uú]s|harina|caldo|tomate triturado|nuez|nueces|rice|lentil|chickpea|bean|flour|oat|broth)/.test(
      lower,
    )
  ) {
    return 'Despensa y Cereales';
  }
  if (
    /(aceite|sal|pimienta|miel|piment[oó]n|curry|comino|vinagre|mostaza|pesto|salsa|az[uú]car|oil|salt|pepper|honey|spice|vinegar|sauce)/.test(
      lower,
    )
  ) {
    return 'Condimentos y Otros';
  }
  return 'Frutas y Verduras';
}

function parseMeasureString(rawMeasure = '') {
  const clean = rawMeasure.trim().toLowerCase();
  if (!clean) return { amount: 1, unit: 'ud' };

  const numMatch = clean.match(/^(\d+(?:[.,/]\d+)?)\s*(.*)$/);
  let amount = 1;
  let rest = clean;

  if (numMatch) {
    const rawNum = numMatch[1].replace(',', '.');
    if (rawNum.includes('/')) {
      const [a, b] = rawNum.split('/').map(Number);
      amount = b ? a / b : 1;
    } else {
      amount = Number(rawNum) || 1;
    }
    rest = (numMatch[2] || '').trim();
  }

  let unit = 'ud';
  if (/^(g|gr|gram|grams|gramos)\b/.test(rest)) unit = 'g';
  else if (/^(kg|kilo|kilos)\b/.test(rest)) unit = 'kg';
  else if (/^(ml|mililitros)\b/.test(rest)) unit = 'ml';
  else if (/^(l|litro|litros)\b/.test(rest)) unit = 'l';
  else if (/^(tbsp|tablespoon|cda|cucharada)/.test(rest)) unit = 'cda';
  else if (/^(tsp|teaspoon|cdta|cucharadita)/.test(rest)) unit = 'cdta';
  else if (/^(cup|cups|taza)/.test(rest)) unit = 'taza';
  else if (/^(clove|cloves|diente)/.test(rest)) unit = 'diente';
  else if (/^(bunch|manojo)/.test(rest)) unit = 'manojo';
  else if (/^(pinch|pizca)/.test(rest)) unit = 'pizca';
  else if (/^(slice|slices|rebanada)/.test(rest)) unit = 'rebanada';

  return { amount, unit };
}

function convertMealDbItemToRecipe(meal) {
  const rawIngredients = [];
  for (let i = 1; i <= 20; i += 1) {
    const ingName = (meal[`strIngredient${i}`] || '').trim();
    const ingMeasure = (meal[`strMeasure${i}`] || '').trim();
    if (!ingName) continue;

    const { amount, unit } = parseMeasureString(ingMeasure);
    rawIngredients.push({
      id: generateId('ing'),
      name: ingName.charAt(0).toUpperCase() + ingName.slice(1),
      amount,
      unit,
      category: categorizeIngredientName(ingName),
    });
  }

  // Las recetas de TheMealDB suelen venir para ~4 raciones; escalamos a 2 personas por defecto
  const assumedSourceServings = 4;
  const scaledIngredients = scaleIngredients(rawIngredients, assumedSourceServings, DEFAULT_SERVINGS);

  const rawSteps = (meal.strInstructions || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^\d+[.)]\s*/, '').trim())
    .filter((line) => line.length > 5)
    .slice(0, 8);

  const catLower = (meal.strCategory || '').toLowerCase();
  const mealCategory = catLower.includes('breakfast') ? 'desayuno' : 'comida';

  const baseRecipe = {
    id: `mealdb_${meal.idMeal}`,
    name: meal.strMeal,
    mealCategory,
    prepTime: 30,
    servings: DEFAULT_SERVINGS,
    description: `Receta obtenida de Internet (${meal.strArea || 'Internacional'} · ${meal.strCategory || 'General'}), ajustada a 2 personas.`,
    sourceLabel: 'TheMealDB (Internet)',
    sourceUrl: meal.strSource || meal.strYoutube || `https://www.themealdb.com/meal/${meal.idMeal}`,
    imageUrl: meal.strMealThumb || '',
    ingredients: scaledIngredients,
    steps: rawSteps,
  };

  return {
    ...baseRecipe,
    dietGroup: inferDietGroup(baseRecipe),
  };
}

function translateQueryForMealDb(query = '') {
  const words = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '';

  for (const w of words) {
    if (ES_TO_EN_SEARCH_MAP[w]) return ES_TO_EN_SEARCH_MAP[w];
  }
  return query.trim();
}

export async function searchInternetRecipes(query = '', dietGroupFilter = 'all') {
  const cleanQuery = query.trim().toLowerCase();

  // 1. Filtrar catálogo curado en español
  const localMatches = ONLINE_SPANISH_RECIPES_DB.filter((r) => {
    const matchesDiet = dietGroupFilter === 'all' || r.dietGroup === dietGroupFilter;
    const matchesText =
      !cleanQuery ||
      r.name.toLowerCase().includes(cleanQuery) ||
      r.description.toLowerCase().includes(cleanQuery) ||
      r.ingredients.some((i) => i.name.toLowerCase().includes(cleanQuery));
    return matchesDiet && matchesText;
  }).map((r) => ({ ...r, servings: DEFAULT_SERVINGS }));

  // 2. Consultar API pública TheMealDB en Internet
  let remoteRecipes = [];
  let apiReachable = false;
  try {
    const searchTerms = cleanQuery
      ? [translateQueryForMealDb(cleanQuery)]
      : (DIET_GROUP_FALLBACK_TERMS[dietGroupFilter] || DIET_GROUP_FALLBACK_TERMS.all).slice(0, 2);

    const responses = await Promise.all(
      searchTerms.map(async (term) => {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;
        try {
          const res = await fetch(
            `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(term)}`,
            controller ? { signal: controller.signal } : undefined,
          );
          if (!res.ok) return [];
          apiReachable = true;
          const data = await res.json();
          return Array.isArray(data?.meals) ? data.meals.slice(0, 6) : [];
        } finally {
          if (timer) clearTimeout(timer);
        }
      }),
    );

    const uniqueMeals = new Map();
    for (const batch of responses) {
      for (const meal of batch) {
        if (!uniqueMeals.has(meal.idMeal)) {
          const converted = convertMealDbItemToRecipe(meal);
          if (dietGroupFilter === 'all' || converted.dietGroup === dietGroupFilter) {
            uniqueMeals.set(meal.idMeal, converted);
          }
        }
      }
    }
    remoteRecipes = Array.from(uniqueMeals.values());
  } catch {
    apiReachable = false;
  }

  return {
    results: [...localMatches, ...remoteRecipes],
    apiReachable,
  };
}

// ============================================================================
// 2. LECTOR Y CONVERSOR DE PDF A RECETA (2 PERSONAS)
// ============================================================================

async function decompressFlateBytes(bytes) {
  if (typeof DecompressionStream === 'undefined') {
    return null;
  }

  for (const format of ['deflate', 'deflate-raw']) {
    try {
      const ds = new DecompressionStream(format);
      const writer = ds.writable.getWriter();
      writer.write(bytes);
      writer.close();
      const response = new Response(ds.readable);
      const buf = await response.arrayBuffer();
      return new Uint8Array(buf);
    } catch {
      // Probar siguiente formato
    }
  }
  return null;
}

function bytesToLatin1(bytes) {
  let out = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    out += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return out;
}

function decodePdfLiteralString(raw) {
  let out = '';
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (ch !== '\\') {
      out += ch;
      continue;
    }
    i += 1;
    if (i >= raw.length) break;
    const esc = raw[i];
    if (esc === 'n') out += '\n';
    else if (esc === 'r') out += '\r';
    else if (esc === 't') out += '\t';
    else if (esc === 'b') out += '\b';
    else if (esc === 'f') out += '\f';
    else if (esc === '(' || esc === ')' || esc === '\\') out += esc;
    else if (/[0-7]/.test(esc)) {
      const oct = raw.slice(i, i + 3).match(/^[0-7]{1,3}/)[0];
      out += String.fromCharCode(parseInt(oct, 8));
      i += oct.length - 1;
    } else if (esc === '\r' || esc === '\n') {
      if (esc === '\r' && raw[i + 1] === '\n') i += 1;
    } else {
      out += esc;
    }
  }
  return out;
}

function decodePdfHexString(hex) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (!clean) return '';
  const padded = clean.length % 2 === 1 ? `${clean}0` : clean;
  const bytes = [];
  for (let i = 0; i < padded.length; i += 2) {
    bytes.push(parseInt(padded.slice(i, i + 2), 16));
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    let utf16 = '';
    for (let i = 2; i + 1 < bytes.length; i += 2) {
      utf16 += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    }
    return utf16;
  }
  return bytes.map((b) => String.fromCharCode(b)).join('');
}

function extractTextOperatorsFromStream(content) {
  const lines = [];
  let currentLine = '';

  const btBlocks = content.match(/BT[\s\S]*?ET/g) || [content];
  for (const block of btBlocks) {
    const tokens =
      block.match(/\((?:\\.|[^\\()])*\)|<[0-9a-fA-F\s]+>|T\*|Td|TD|Tm|TJ|Tj|'|"/g) || [];

    let pendingBuffer = '';
    for (const token of tokens) {
      if (token.startsWith('(') && token.endsWith(')')) {
        pendingBuffer += decodePdfLiteralString(token.slice(1, -1));
      } else if (token.startsWith('<') && token.endsWith('>')) {
        pendingBuffer += decodePdfHexString(token.slice(1, -1));
      } else if (token === 'Tj' || token === 'TJ') {
        currentLine += pendingBuffer;
        pendingBuffer = '';
      } else if (token === "'" || token === '"') {
        if (currentLine.trim()) lines.push(currentLine.trim());
        currentLine = pendingBuffer;
        pendingBuffer = '';
      } else if (token === 'Td' || token === 'TD' || token === 'T*' || token === 'Tm') {
        if (pendingBuffer) {
          currentLine += pendingBuffer;
          pendingBuffer = '';
        }
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
          currentLine = '';
        }
      }
    }
    if (pendingBuffer) currentLine += pendingBuffer;
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
      currentLine = '';
    }
  }

  return lines.join('\n');
}

function parseIngredientLine(line) {
  let clean = line
    .replace(/^[-•*▪▫►]\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim();
  if (!clean || clean.length < 2) return null;

  // Formato: "300 g de garbanzos cocidos" o "2 zanahorias" o "200ml leche"
  const match = clean.match(
    /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*(kg|g|gr|gramos|ml|l|litros|ud|uds|unidades?|cda|cdas|cucharadas?|cdta|cdtas|cucharaditas?|taza|tazas|rebanada|rebanadas|diente|dientes|manojo|manojos|pizca|pizcas)?\s*(?:de\s+)?(.+)$/i,
  );

  let amount = 1;
  let unit = 'ud';
  let name = clean;

  if (match) {
    const rawNum = match[1].replace(/\s+/g, '').replace(',', '.');
    if (rawNum.includes('/')) {
      const [a, b] = rawNum.split('/').map(Number);
      amount = b ? a / b : 1;
    } else {
      amount = Number(rawNum) || 1;
    }

    const rawUnit = (match[2] || '').toLowerCase();
    if (/^(g|gr|gramos)$/.test(rawUnit)) unit = 'g';
    else if (rawUnit === 'kg') unit = 'kg';
    else if (rawUnit === 'ml') unit = 'ml';
    else if (/^(l|litros?)$/.test(rawUnit)) unit = 'l';
    else if (/^(cda|cdas|cucharadas?)$/.test(rawUnit)) unit = 'cda';
    else if (/^(cdta|cdtas|cucharaditas?)$/.test(rawUnit)) unit = 'cdta';
    else if (/^tazas?$/.test(rawUnit)) unit = 'taza';
    else if (/^rebanadas?$/.test(rawUnit)) unit = 'rebanada';
    else if (/^dientes?$/.test(rawUnit)) unit = 'diente';
    else if (/^manojos?$/.test(rawUnit)) unit = 'manojo';
    else if (/^pizcas?$/.test(rawUnit)) unit = 'pizca';
    else unit = 'ud';

    name = match[3].trim();
  }

  name = name.replace(/^[.,:\s]+|[.,:\s]+$/g, '');
  if (!name) return null;

  return {
    id: generateId('ing'),
    name: name.charAt(0).toUpperCase() + name.slice(1),
    amount,
    unit,
    category: categorizeIngredientName(name),
  };
}

export function parseRecipeTextToStructured(rawText = '', fileName = 'Receta PDF') {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const cleanFileName = fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ').trim() || 'Receta importada de PDF';

  let title = '';
  let originalServings = DEFAULT_SERVINGS;
  let prepTime = 25;
  let mealCategory = 'comida';
  let description = '';
  const rawIngredientLines = [];
  const rawStepLines = [];

  let currentSection = 'header';

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (/^(ingredientes|ingredients)\b[:\s-]*$/i.test(lower)) {
      currentSection = 'ingredients';
      continue;
    }
    if (/^(preparaci[oó]n|elaboraci[oó]n|pasos|instrucciones|instructions|steps|modo de empleo)\b[:\s-]*$/i.test(lower)) {
      currentSection = 'steps';
      continue;
    }

    const titleMeta = line.match(/^(?:t[ií]tulo|receta|nombre|title)\s*:\s*(.+)$/i);
    if (titleMeta) {
      title = titleMeta[1].trim();
      continue;
    }

    const servingsMeta = line.match(/(?:raciones|porciones|personas|comensales|servings)\s*[:\-]?\s*(\d+)/i) ||
      line.match(/para\s+(\d+)\s+(?:personas|raciones|comensales)/i);
    if (servingsMeta && currentSection === 'header') {
      originalServings = Math.max(1, Number(servingsMeta[1]) || DEFAULT_SERVINGS);
      continue;
    }

    const timeMeta = line.match(/(?:tiempo|duraci[oó]n|prep)\s*[:\-]?\s*(\d+)\s*(?:min|minutos|m\b)/i);
    if (timeMeta && currentSection === 'header') {
      prepTime = Math.max(1, Number(timeMeta[1]) || 25);
      continue;
    }

    const mealMeta = line.match(/(?:comida|categor[ií]a|tipo)\s*[:\-]?\s*(desayuno|comida|almuerzo|cena)/i);
    if (mealMeta) {
      const m = mealMeta[1].toLowerCase();
      mealCategory = m === 'almuerzo' ? 'comida' : m;
      continue;
    }

    if (currentSection === 'header') {
      if (!title && line.length >= 3 && line.length <= 90) {
        title = line;
      } else if (!description && line.length > 10) {
        description = line;
      }
    } else if (currentSection === 'ingredients') {
      if (/^(preparaci[oó]n|elaboraci[oó]n|pasos|instrucciones)\s*:/i.test(lower)) {
        currentSection = 'steps';
        const after = line.split(':').slice(1).join(':').trim();
        if (after) rawStepLines.push(after);
      } else {
        rawIngredientLines.push(line);
      }
    } else if (currentSection === 'steps') {
      rawStepLines.push(line.replace(/^\d+[.)]\s*/, '').trim());
    }
  }

  // Fallback si no hubo encabezados explícitos de ingredientes/pasos
  if (rawIngredientLines.length === 0) {
    for (const line of lines) {
      if (line === title) continue;
      if (/^[-•*]\s+/.test(line) || /^\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l|ud|cda|cdta|taza|diente)?\b/i.test(line)) {
        rawIngredientLines.push(line);
      }
    }
  }

  const parsedIngredients = rawIngredientLines
    .map(parseIngredientLine)
    .filter(Boolean);

  // Escalar automáticamente las cantidades originales del PDF a 2 personas
  const scaledIngredients = scaleIngredients(
    parsedIngredients,
    originalServings,
    DEFAULT_SERVINGS,
  );

  const finalName = title || cleanFileName;
  const recipeCandidate = {
    id: generateId('rec_pdf'),
    name: finalName,
    mealCategory,
    prepTime,
    servings: DEFAULT_SERVINGS,
    description:
      description ||
      `Receta importada desde PDF (${fileName})${
        originalServings !== DEFAULT_SERVINGS
          ? ` · Cantidades ajustadas de ${originalServings} a 2 personas`
          : ' · Ajustada para 2 personas'
      }.`,
    ingredients: scaledIngredients,
    steps: rawStepLines.filter(Boolean),
  };

  return {
    recipe: {
      ...recipeCandidate,
      dietGroup: inferDietGroup(recipeCandidate),
    },
    originalServings,
    scaledToServings: DEFAULT_SERVINGS,
    rawText,
  };
}

export async function extractRecipeFromPdf(file) {
  if (!file) {
    throw new Error('No se ha seleccionado ningún archivo PDF.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // 1. Si el navegador tiene window.pdfjsLib disponible, usarlo primero
  if (typeof window !== 'undefined' && window.pdfjsLib?.getDocument) {
    try {
      const pdfDoc = await window.pdfjsLib.getDocument({ data: bytes }).promise;
      let fullText = '';
      for (let p = 1; p <= pdfDoc.numPages; p += 1) {
        const page = await pdfDoc.getPage(p);
        const textContent = await page.getTextContent();
        fullText += `${textContent.items.map((item) => item.str).join(' ')}\n`;
      }
      if (fullText.trim()) {
        return parseRecipeTextToStructured(fullText, file.name);
      }
    } catch {
      // Continuar con extractor nativo
    }
  }

  // 2. Extractor PDF nativo (soporta streams sin comprimir y FlateDecode)
  const latin1 = bytesToLatin1(bytes);
  const extractedChunks = [];
  const streamRegex = /<<([\s\S]*?)>>\s*stream\r?\n([\s\S]*?)endstream/g;
  let match;

  while ((match = streamRegex.exec(latin1)) !== null) {
    const dict = match[1];
    const streamStart = match.index + match[0].indexOf('stream');
    const afterStreamKeyword = latin1.slice(streamStart, streamStart + 10);
    const headerOffset = afterStreamKeyword.startsWith('stream\r\n') ? 8 : 7;
    const rawStart = streamStart + headerOffset;
    const rawEnd = match.index + match[0].length - 'endstream'.length;

    let streamBytes = bytes.subarray(rawStart, rawEnd);
    if (streamBytes.length > 0 && (streamBytes[streamBytes.length - 1] === 10 || streamBytes[streamBytes.length - 1] === 13)) {
      streamBytes = streamBytes.subarray(0, streamBytes.length - 1);
    }

    let decodedText = '';
    if (/\/FlateDecode/i.test(dict)) {
      const inflated = await decompressFlateBytes(streamBytes);
      if (inflated) {
        decodedText = bytesToLatin1(inflated);
      }
    } else {
      decodedText = bytesToLatin1(streamBytes);
    }

    if (decodedText && (decodedText.includes('Tj') || decodedText.includes('TJ') || decodedText.includes('BT'))) {
      const textFromOps = extractTextOperatorsFromStream(decodedText);
      if (textFromOps.trim()) {
        extractedChunks.push(textFromOps);
      }
    }
  }

  if (extractedChunks.length === 0) {
    // Fallback para operadores de texto fuera de stream comprimido
    const fallback = extractTextOperatorsFromStream(latin1);
    if (fallback.trim()) {
      extractedChunks.push(fallback);
    }
  }

  const combinedText = extractedChunks.join('\n').trim();
  if (!combinedText) {
    throw new Error(
      'No se pudo extraer texto legible de este PDF (puede ser una imagen escaneada). Puedes pegar o editar la receta manualmente en el formulario.',
    );
  }

  return parseRecipeTextToStructured(combinedText, file.name);
}

function escapePdfString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Genera un archivo PDF válido de ejemplo para probar la función "Importar PDF".
 * Incluye una receta para 4 personas para demostrar el reescalado automático a 2 personas.
 */
export function generateSampleRecipePdfBlob() {
  const lines = [
    'Titulo: Merluza al horno con patatas panadera y limon',
    'Comida: cena',
    'Tiempo: 30 min',
    'Para 4 personas',
    'Ingredientes:',
    '- 700 g de lomos de merluza',
    '- 600 g de patatas',
    '- 2 ud de cebolla',
    '- 2 ud de limon',
    '- 4 cda de aceite de oliva virgen',
    '- 2 diente de ajo',
    'Preparacion:',
    '1. Cortar las patatas y la cebolla en rodajas finas y hornear 15 minutos a 190 C.',
    '2. Colocar los lomos de merluza encima con ajo laminado y rodajas de limon.',
    '3. Hornear 12 minutos adicionales hasta que el pescado este jugoso.',
  ];

  const ops = ['BT', '/F1 12 Tf', '50 770 Td', '18 TL'];
  lines.forEach((line, idx) => {
    const safe = escapePdfString(line);
    if (idx === 0) ops.push(`(${safe}) Tj`);
    else ops.push(`T* (${safe}) Tj`);
  });
  ops.push('ET');
  const streamBody = ops.join('\n');

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n',
    `5 0 obj\n<< /Length ${streamBody.length} >>\nstream\n${streamBody}\nendstream\nendobj\n`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}

// ============================================================================
// 3. EXPORTACIÓN DE LISTA DE LA COMPRA COMO CHECKLIST COMPARTIDO EN GOOGLE DRIVE
// ============================================================================

export const DEFAULT_PARTNER_EMAIL = 'rosacng97@gmail.com';
export const SHARED_DRIVE_FOLDER_ID = '1DreE_8M_9YVL5Ml4EYAV1xQ-9fSTTFGT';
export const SHARED_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/1DreE_8M_9YVL5Ml4EYAV1xQ-9fSTTFGT';
export const SHARED_DRIVE_DOC_ID = '1XU6hMgvdTw_uBeIPnZedPhlaWDqhcjWa_-YoQcqALaI';
export const SHARED_DRIVE_DOC_URL =
  'https://docs.google.com/document/d/1XU6hMgvdTw_uBeIPnZedPhlaWDqhcjWa_-YoQcqALaI/edit?usp=drivesdk';

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var targetId = data.docId || '${SHARED_DRIVE_DOC_ID}';
  var doc = targetId ? DocumentApp.openById(targetId) : DocumentApp.create(data.title || 'Lista de la Compra - MenuPlan');
  var body = doc.getBody();
  body.clear();
  body.appendParagraph(data.title || 'Lista de la Compra Definitiva (2 personas)')
      .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Actualizada automaticamente por MenuPlan');

  (data.groups || []).forEach(function(group) {
    body.appendParagraph(group.category).setHeading(DocumentApp.ParagraphHeading.HEADING2);
    group.items.forEach(function(item) {
      var qty = item.amount > 0 ? ' — ' + item.amount + ' ' + item.unit : '';
      body.appendListItem(item.name + qty).setGlyphType(DocumentApp.GlyphType.CHECKBOX);
    });
  });

  doc.saveAndClose();
  var file = DriveApp.getFileById(doc.getId());
  if (data.partnerEmail) {
    file.addEditor(data.partnerEmail);
  }
  return ContentService.createTextOutput(JSON.stringify({
    url: doc.getUrl(),
    id: doc.getId()
  })).setMimeType(ContentService.MimeType.JSON);
}`;

export function buildChecklistText(groupedItems = [], servings = DEFAULT_SERVINGS) {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const lines = [
    `LISTA DE LA COMPRA DEFINITIVA — ${servings} PERSONAS (${dateStr})`,
    '====================================================',
    '',
  ];

  for (const group of groupedItems) {
    lines.push(`[ ${group.category.label.toUpperCase()} ]`);
    for (const item of group.items) {
      const qty = item.amount > 0 ? ` — ${formatAmount(item.amount)} ${item.unit}` : '';
      lines.push(`☐ ${item.name}${qty}`);
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

export function buildChecklistHtmlDoc(groupedItems = [], title = 'Lista de la Compra Definitiva (2 personas)') {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const sectionsHtml = groupedItems
    .map(
      (group) => `
      <h2 style="color:#065f46;font-size:15px;margin:18px 0 8px 0;border-bottom:1px solid #d1fae5;padding-bottom:4px;">
        ${group.category.label} (${group.items.length})
      </h2>
      <ul style="list-style:none;padding-left:0;margin:0;">
        ${group.items
          .map((item, idx) => {
            const qty =
              item.amount > 0
                ? ` <span style="color:#475569;">— ${formatAmount(item.amount)} ${item.unit}</span>`
                : '';
            const checkId = `chk_${group.category.label.replace(/\W+/g, '')}_${idx}`;
            return `<li style="margin:6px 0;font-size:13px;line-height:1.4;"><label for="${checkId}" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><input id="${checkId}" type="checkbox" style="width:14px;height:14px;accent-color:#059669;" /><span><strong>${item.name}</strong>${qty}</span></label></li>`;
          })
          .join('')}
      </ul>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    input[type="checkbox"]:checked + span {
      text-decoration: line-through;
      color: #94a3b8;
    }
  </style>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#1e293b;max-width:720px;margin:24px auto;padding:16px;">
  <h1 style="color:#0f172a;font-size:22px;margin-bottom:4px;">${title}</h1>
  <p style="color:#64748b;font-size:12px;margin-top:0;">Generada el ${dateStr} · Formato checklist compartido</p>
  ${sectionsHtml}
</body>
</html>`;
}

export async function createSharedGoogleDocViaApi({
  accessToken,
  title,
  htmlContent,
  docId = SHARED_DRIVE_DOC_ID,
  partnerEmail = '',
  permissionRole = 'writer',
}) {
  const cleanToken = (accessToken || '').trim();
  if (!cleanToken) {
    throw new Error('Introduce un token OAuth de Google Drive para sincronizar el documento.');
  }

  const boundary = `menuplan_${Date.now()}`;
  const isUpdate = Boolean(docId);
  const metadata = isUpdate
    ? { name: title }
    : {
        name: title,
        mimeType: 'application/vnd.google-apps.document',
        parents: [SHARED_DRIVE_FOLDER_ID],
      };

  const multipartBody = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    '',
    htmlContent,
    `--${boundary}--`,
  ].join('\r\n');

  const endpoint = isUpdate
    ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(docId)}?uploadType=multipart&fields=id,name,webViewLink`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink';

  const createRes = await fetch(endpoint, {
    method: isUpdate ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Error al sincronizar el documento en Google Drive (${createRes.status}): ${errText}`);
  }

  const created = await createRes.json();
  const cleanPartner = (partnerEmail || '').trim();
  let shared = true;

  if (cleanPartner) {
    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(created.id)}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'writer',
          type: 'user',
          emailAddress: cleanPartner,
        }),
      },
    );
    shared = permRes.ok;
  } else if (!isUpdate) {
    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(created.id)}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: permissionRole,
          type: 'anyone',
        }),
      },
    );
    shared = permRes.ok;
  }

  return {
    id: created.id,
    name: created.name,
    url: created.webViewLink || `https://docs.google.com/document/d/${created.id}/edit`,
    shared,
  };
}

export async function exportChecklistViaAppsScript({
  scriptUrl,
  title,
  groupedItems,
  docId = SHARED_DRIVE_DOC_ID,
  partnerEmail = '',
}) {
  const cleanUrl = (scriptUrl || '').trim();
  if (!cleanUrl) {
    throw new Error('Introduce la URL de tu Web App de Google Apps Script.');
  }

  const payload = {
    docId,
    partnerEmail: (partnerEmail || '').trim(),
    title,
    groups: groupedItems.map((g) => ({
      category: g.category.label,
      items: g.items.map((item) => ({
        name: item.name,
        amount: item.amount,
        unit: item.unit,
      })),
    })),
  };

  const res = await fetch(cleanUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`El script de Google Apps respondió con error (${res.status}).`);
  }

  const data = await res.json();
  if (!data?.url) {
    throw new Error('El script se ejecutó pero no devolvió el enlace del documento compartido.');
  }

  return data;
}
