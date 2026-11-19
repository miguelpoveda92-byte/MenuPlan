import {
  DEFAULT_SERVINGS,
  generateId,
  inferDietGroup,
  scaleIngredients,
  formatAmount,
  canonicalizeIngredientName,
  getShoppingItemAmountDisplay,
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
    /(al gusto|ajo en polvo|aceite|sal\b|pimienta|miel|piment[oó]n|curry|comino|vinagre|mostaza|pesto|salsa|az[uú]car|oil|salt|pepper|honey|spice|vinegar|sauce)/.test(
      lower,
    )
  ) {
    return 'Condimentos y Otros';
  }
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
// 1B. EXTRACTOR AUTOMÁTICO DE RECETAS DESDE UN ENLACE WEB (URL)
// ============================================================================

function decodeHtmlEntities(str = '') {
  return String(str)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&aacute;/gi, 'á')
    .replace(/&eacute;/gi, 'é')
    .replace(/&iacute;/gi, 'í')
    .replace(/&oacute;/gi, 'ó')
    .replace(/&uacute;/gi, 'ú')
    .replace(/&ntilde;/gi, 'ñ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseIsoDurationToMinutes(iso = '') {
  const str = String(iso || '').trim();
  if (!str) return null;
  if (/^\d+$/.test(str)) return Number(str);
  const m = str.match(/P(?:\d+D)?T(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!m) {
    const minsMatch = str.match(/(\d+)\s*(?:min|m\b)/i);
    return minsMatch ? Number(minsMatch[1]) : null;
  }
  const hours = Number(m[1] || 0);
  const mins = Number(m[2] || 0);
  const total = hours * 60 + mins;
  return total > 0 ? total : null;
}

function parseServingsCount(rawYield) {
  const text = Array.isArray(rawYield) ? String(rawYield[0] || '') : String(rawYield || '');
  const m = text.match(/(\d+)/);
  if (!m) return DEFAULT_SERVINGS;
  const val = Number(m[1]);
  return val >= 1 && val <= 30 ? val : DEFAULT_SERVINGS;
}

function flattenJsonLdInstructions(inst) {
  if (!inst) return [];
  if (typeof inst === 'string') {
    return inst
      .split(/\r?\n/)
      .map((s) => decodeHtmlEntities(s.replace(/^\d+[.)]\s*/, '')))
      .filter((s) => s.length > 4);
  }
  if (Array.isArray(inst)) {
    return inst.flatMap(flattenJsonLdInstructions);
  }
  if (typeof inst === 'object') {
    if (inst.itemListElement) return flattenJsonLdInstructions(inst.itemListElement);
    if (inst.text) return flattenJsonLdInstructions(inst.text);
    if (inst.name && !inst['@type']?.toLowerCase?.().includes('section')) {
      return flattenJsonLdInstructions(inst.name);
    }
  }
  return [];
}

function findRecipeNodeInJsonLd(node) {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipeNodeInJsonLd(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === 'object') {
    const rawType = node['@type'];
    const types = Array.isArray(rawType) ? rawType : [rawType];
    if (types.some((t) => typeof t === 'string' && /(?:^|:)recipe$/i.test(t.trim()))) {
      return node;
    }
    if (node['@graph']) {
      const foundGraph = findRecipeNodeInJsonLd(node['@graph']);
      if (foundGraph) return foundGraph;
    }
    if (node.mainEntity) {
      const foundMain = findRecipeNodeInJsonLd(node.mainEntity);
      if (foundMain) return foundMain;
    }
  }
  return null;
}

function detectMealCategoryFromText(text = '') {
  const lower = String(text).toLowerCase();
  if (/(desayuno|merienda|tostada|porridge|tortitas|gachas|breakfast|brunch|snack)/.test(lower)) {
    return 'desayuno';
  }
  if (/(cena|crema de|sopa de|ensalada|tortilla|revuelto|hervido|dinner|supper)/.test(lower)) {
    return 'cena';
  }
  return 'comida';
}

function extractImageUrl(imageField) {
  if (!imageField) return '';
  if (typeof imageField === 'string') return imageField;
  if (Array.isArray(imageField)) return extractImageUrl(imageField[0]);
  if (typeof imageField === 'object') return imageField.url || imageField.contentUrl || '';
  return '';
}

function parseWebIngredientString(raw = '') {
  // Normalizar fracciones unicode y rangos simples antes de pasar a parseIngredientLine
  const normalized = decodeHtmlEntities(raw)
    .replace(/½/g, '0.5')
    .replace(/¼/g, '0.25')
    .replace(/¾/g, '0.75')
    .replace(/⅓/g, '0.33')
    .replace(/⅔/g, '0.67')
    .replace(/^[-•*▪]\s*/, '')
    .trim();
  if (!normalized) return null;

  // Intentar formato inglés común cuando la web está en inglés o mixto ("200g chicken breast", "2 tbsp olive oil")
  const enMatch = normalized.match(
    /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*(tbsp|tablespoons?|tsp|teaspoons?|cups?|cloves?|oz|ounces?|lb|lbs|pounds?|slices?)\b\s*(?:of\s+)?(.+)$/i,
  );
  if (enMatch) {
    const rawNum = enMatch[1].replace(/\s+/g, '').replace(',', '.');
    let amount = Number(rawNum) || 1;
    if (rawNum.includes('/')) {
      const [a, b] = rawNum.split('/').map(Number);
      amount = b ? a / b : 1;
    }
    const u = enMatch[2].toLowerCase();
    let unit = 'ud';
    if (u.startsWith('tbsp') || u.startsWith('tablespoon')) unit = 'cda';
    else if (u.startsWith('tsp') || u.startsWith('teaspoon')) unit = 'cdta';
    else if (u.startsWith('cup')) unit = 'taza';
    else if (u.startsWith('clove')) unit = 'diente';
    else if (u.startsWith('slice')) unit = 'rebanada';
    else if (u === 'oz' || u.startsWith('ounce')) {
      amount = Math.round(amount * 28.35);
      unit = 'g';
    } else if (u.startsWith('lb') || u.startsWith('pound')) {
      amount = Math.round(amount * 453.6);
      unit = 'g';
    }
    const ingName = enMatch[3].replace(/\([^)]*\)$/, '').trim();
    if (ingName) {
      return {
        id: generateId('ing'),
        name: ingName.charAt(0).toUpperCase() + ingName.slice(1),
        amount,
        unit,
        keepFixed: false,
        category: categorizeIngredientName(ingName),
      };
    }
  }

  return parseIngredientLine(normalized);
}

export function extractRecipeFieldsFromHtml(html = '', url = '') {
  let hostLabel = 'Web';
  try {
    hostLabel = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    // ignore
  }

  // Estrategia 1: Schema.org JSON-LD (el estándar de casi todas las webs de recetas)
  const ldMatches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of ldMatches) {
    try {
      const rawJson = m[1].trim().replace(/^\s*<!--/, '').replace(/-->\s*$/, '');
      const parsed = JSON.parse(rawJson);
      const recipeNode = findRecipeNodeInJsonLd(parsed);
      if (recipeNode && recipeNode.name) {
        const sourceServings = parseServingsCount(recipeNode.recipeYield);
        const prepTime =
          parseIsoDurationToMinutes(recipeNode.totalTime) ||
          parseIsoDurationToMinutes(recipeNode.prepTime) ||
          parseIsoDurationToMinutes(recipeNode.cookTime) ||
          25;

        const rawIngList = Array.isArray(recipeNode.recipeIngredient)
          ? recipeNode.recipeIngredient
          : Array.isArray(recipeNode.ingredients)
            ? recipeNode.ingredients
            : [];

        const parsedIngs = rawIngList.map(parseWebIngredientString).filter(Boolean);
        const scaledIngredients = scaleIngredients(parsedIngs, sourceServings, DEFAULT_SERVINGS);
        const steps = flattenJsonLdInstructions(recipeNode.recipeInstructions);
        const cleanTitle = decodeHtmlEntities(recipeNode.name);
        const descText = decodeHtmlEntities(recipeNode.description || '').slice(0, 180);
        const catHint = [
          cleanTitle,
          Array.isArray(recipeNode.recipeCategory)
            ? recipeNode.recipeCategory.join(' ')
            : recipeNode.recipeCategory || '',
          Array.isArray(recipeNode.keywords) ? recipeNode.keywords.join(' ') : recipeNode.keywords || '',
        ].join(' ');

        const candidate = {
          id: generateId('rec_url'),
          name: cleanTitle,
          mealCategory: detectMealCategoryFromText(catHint),
          prepTime,
          servings: DEFAULT_SERVINGS,
          description:
            descText ||
            `Receta extraída de ${hostLabel}${
              sourceServings !== DEFAULT_SERVINGS
                ? ` · Reescalada de ${sourceServings} a ${DEFAULT_SERVINGS} personas`
                : ' · Ajustada a 2 personas'
            }.`,
          sourceLabel: hostLabel,
          sourceUrl: url,
          imageUrl: extractImageUrl(recipeNode.image),
          ingredients: scaledIngredients,
          steps,
        };

        return {
          recipe: { ...candidate, dietGroup: inferDietGroup(candidate) },
          originalServings: sourceServings,
          extractionMethod: 'JSON-LD (Schema.org)',
        };
      }
    } catch {
      // Continuar con el siguiente script JSON-LD o pasar a DOMParser
    }
  }

  // Estrategia 2: DOMParser / selectores HTML semánticos
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const h1Title = doc.querySelector('h1')?.textContent?.trim();
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim();
      const docTitle = doc.querySelector('title')?.textContent?.split('|')[0]?.split(' - ')[0]?.trim();
      const title = decodeHtmlEntities(h1Title || ogTitle || docTitle || '');

      const descMeta =
        doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        '';

      const ingSelectors = [
        '[itemprop="recipeIngredient"]',
        '[itemprop="ingredients"]',
        '.ingredient',
        '.ingredients li',
        '[class*="ingred"] li',
        '[class*="Ingred"] li',
      ];
      let ingNodes = [];
      for (const sel of ingSelectors) {
        const found = Array.from(doc.querySelectorAll(sel));
        if (found.length >= 2) {
          ingNodes = found;
          break;
        }
      }

      const stepSelectors = [
        '[itemprop="recipeInstructions"] li',
        '[itemprop="recipeInstructions"] p',
        '.instructions li',
        '.recipe-steps li',
        '[class*="preparacion"] li',
        '[class*="elaboracion"] li',
        '[class*="pasos"] li',
        '[class*="instruction"] p',
      ];
      let stepNodes = [];
      for (const sel of stepSelectors) {
        const found = Array.from(doc.querySelectorAll(sel));
        if (found.length >= 1) {
          stepNodes = found;
          break;
        }
      }

      const parsedIngs = ingNodes
        .map((n) => parseWebIngredientString(n.textContent || ''))
        .filter(Boolean);
      const steps = stepNodes
        .map((n) => decodeHtmlEntities((n.textContent || '').replace(/^\d+[.)]\s*/, '')))
        .filter((s) => s.length > 6);

      if (title && (parsedIngs.length >= 2 || steps.length >= 1)) {
        const bodyText = doc.body?.textContent || '';
        const servingsMatch = bodyText.match(/(\d+)\s*(?:personas?|raciones?|comensales?|porciones?)/i);
        const sourceServings = servingsMatch ? parseServingsCount(servingsMatch[1]) : DEFAULT_SERVINGS;
        const timeMatch = bodyText.match(/(\d+)\s*(?:min|minutos)\b/i);
        const prepTime = timeMatch ? Math.max(5, Math.min(240, Number(timeMatch[1]))) : 25;

        const scaledIngredients = scaleIngredients(parsedIngs, sourceServings, DEFAULT_SERVINGS);
        const candidate = {
          id: generateId('rec_url'),
          name: title,
          mealCategory: detectMealCategoryFromText(`${title} ${descMeta}`),
          prepTime,
          servings: DEFAULT_SERVINGS,
          description: decodeHtmlEntities(descMeta).slice(0, 180) || `Receta extraída de ${hostLabel}.`,
          sourceLabel: hostLabel,
          sourceUrl: url,
          imageUrl: doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '',
          ingredients: scaledIngredients,
          steps,
        };

        return {
          recipe: { ...candidate, dietGroup: inferDietGroup(candidate) },
          originalServings: sourceServings,
          extractionMethod: 'HTML semántico',
        };
      }
    } catch {
      // Pasar a fallback de texto plano
    }
  }

  return null;
}

export function extractRecipeFromMarkdownOrText(rawText = '', url = '') {
  let hostLabel = 'Web';
  try {
    hostLabel = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    // ignore
  }

  const lines = String(rawText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let title = '';
  let sourceServings = DEFAULT_SERVINGS;
  let prepTime = 25;
  const rawIngLines = [];
  const rawStepLines = [];
  let section = 'none';

  for (const line of lines) {
    if (!title && /^#\s+(.+)$/.test(line)) {
      title = line.replace(/^#\s+/, '').trim();
      continue;
    }
    if (/^Title:\s*(.+)$/i.test(line) && !title) {
      title = line.replace(/^Title:\s*/i, '').trim();
      continue;
    }

    const servM = line.match(/(\d+)\s*(?:personas?|raciones?|comensales?|porciones?|servings?)/i);
    if (servM && section === 'none') {
      sourceServings = parseServingsCount(servM[1]);
    }
    const timeM = line.match(/(\d+)\s*(?:min|minutos)\b/i);
    if (timeM && section === 'none' && prepTime === 25) {
      prepTime = Math.max(5, Math.min(240, Number(timeM[1])));
    }

    const cleanHeading = line.replace(/^#+\s*/, '').replace(/[:*\s]+$/, '').toLowerCase();
    if (/^(ingredientes|ingredients)$/.test(cleanHeading)) {
      section = 'ingredients';
      continue;
    }
    if (/^(preparaci[oó]n|elaboraci[oó]n|c[oó]mo hacer|instrucciones|pasos|instructions|method|steps)$/.test(cleanHeading)) {
      section = 'steps';
      continue;
    }
    if (/^#{1,3}\s+/.test(line) && section !== 'none') {
      section = 'none';
      continue;
    }

    if (section === 'ingredients' && /^[-*•\d]/.test(line)) {
      const cleaned = line.replace(/^[-*•]\s*/, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      if (cleaned.length >= 2 && cleaned.length <= 120) rawIngLines.push(cleaned);
    } else if (section === 'steps' && (line.length > 10 || /^\d+[.)]/.test(line))) {
      const cleaned = line.replace(/^\d+[.)]\s*/, '').replace(/^[-*•]\s*/, '').trim();
      if (cleaned.length > 8 && !/^https?:\/\//.test(cleaned)) rawStepLines.push(cleaned);
    }
  }

  const parsedIngs = rawIngLines.map(parseWebIngredientString).filter(Boolean);
  if (!title && parsedIngs.length === 0) return null;

  const candidate = {
    id: generateId('rec_url'),
    name: title || `Receta de ${hostLabel}`,
    mealCategory: detectMealCategoryFromText(title),
    prepTime,
    servings: DEFAULT_SERVINGS,
    description: `Receta extraída de ${hostLabel} · Ajustada a 2 personas.`,
    sourceLabel: hostLabel,
    sourceUrl: url,
    imageUrl: '',
    ingredients: scaleIngredients(parsedIngs, sourceServings, DEFAULT_SERVINGS),
    steps: rawStepLines.slice(0, 15),
  };

  return {
    recipe: { ...candidate, dietGroup: inferDietGroup(candidate) },
    originalServings: sourceServings,
    extractionMethod: 'Texto estructurado web',
  };
}

export async function extractRecipeFromUrl(rawUrl = '') {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) {
    throw new Error('Pega el enlace (URL) de una receta de Internet.');
  }
  const normalizedUrl = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsedUrl;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    throw new Error('El enlace introducido no tiene un formato de URL válido.');
  }

  const targetUrl = parsedUrl.toString();
  const fetchWithTimeout = async (fetchUrl, headers = {}) => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 12000) : null;
    try {
      const res = await fetch(fetchUrl, {
        ...(controller ? { signal: controller.signal } : {}),
        headers,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  const strategies = [
    async () => {
      const res = await fetchWithTimeout(
        `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`,
      );
      const data = await res.json();
      if (!data?.contents) throw new Error('Sin contenido HTML');
      const extracted = extractRecipeFieldsFromHtml(data.contents, targetUrl);
      if (extracted) return extracted;
      throw new Error('No se encontraron campos de receta en HTML');
    },
    async () => {
      const res = await fetchWithTimeout(
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
      );
      const html = await res.text();
      if (!html || html.length < 200) throw new Error('HTML vacío');
      const extracted = extractRecipeFieldsFromHtml(html, targetUrl);
      if (extracted) return extracted;
      throw new Error('No se encontraron campos de receta en HTML');
    },
    async () => {
      const res = await fetchWithTimeout(`https://r.jina.ai/${targetUrl}`, {
        Accept: 'text/plain',
      });
      const md = await res.text();
      const extracted = extractRecipeFromMarkdownOrText(md, targetUrl);
      if (extracted && (extracted.recipe.ingredients.length > 0 || extracted.recipe.steps.length > 0)) {
        return extracted;
      }
      throw new Error('No se pudo estructurar el contenido de la página');
    },
  ];

  let lastError = null;
  for (const runStrategy of strategies) {
    try {
      const result = await runStrategy();
      if (result?.recipe?.name) {
        return result;
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(
    lastError?.message ||
      'No se pudo leer automáticamente ese enlace (la web puede bloquear accesos externos). Prueba con otro enlace o copia y pega el texto en Importar PDF → Pegar texto.',
  );
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
      const bufferPromise = new Response(ds.readable).arrayBuffer();
      const writer = ds.writable.getWriter();
      writer.write(bytes).catch(() => {});
      writer.close().catch(() => {});
      const buf = await bufferPromise;
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

function decodeUtf16BeHex(hex) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (!clean) return '';
  const padded = clean.length % 4 === 0 ? clean : clean.padStart(Math.ceil(clean.length / 4) * 4, '0');
  let out = '';
  for (let i = 0; i + 3 < padded.length; i += 4) {
    const code = parseInt(padded.slice(i, i + 4), 16);
    if (code > 0) out += String.fromCharCode(code);
  }
  return out;
}

function parseToUnicodeCMap(cmapText, cidMap) {
  const bfcharBlocks = cmapText.match(/beginbfchar[\s\S]*?endbfchar/g) || [];
  for (const block of bfcharBlocks) {
    const pairRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    let m;
    while ((m = pairRegex.exec(block)) !== null) {
      const key = m[1].toUpperCase();
      const val = decodeUtf16BeHex(m[2]);
      if (val) cidMap.set(key, val);
    }
  }

  const bfrangeBlocks = cmapText.match(/beginbfrange[\s\S]*?endbfrange/g) || [];
  for (const block of bfrangeBlocks) {
    const arrayRangeRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*\[([\s\S]*?)\]/g;
    let am;
    while ((am = arrayRangeRegex.exec(block)) !== null) {
      const start = parseInt(am[1], 16);
      const end = parseInt(am[2], 16);
      const hexLen = am[1].length;
      const items = am[3].match(/<([0-9a-fA-F]+)>/g) || [];
      const limit = Math.min(end - start + 1, items.length, 2048);
      for (let i = 0; i < limit; i += 1) {
        const key = (start + i).toString(16).toUpperCase().padStart(hexLen, '0');
        const val = decodeUtf16BeHex(items[i].slice(1, -1));
        if (val) cidMap.set(key, val);
      }
    }

    const seqRangeRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    let sm;
    while ((sm = seqRangeRegex.exec(block)) !== null) {
      const start = parseInt(sm[1], 16);
      const end = parseInt(sm[2], 16);
      const hexLen = sm[1].length;
      const dstStart = parseInt(sm[3], 16);
      const limit = Math.min(end - start + 1, 2048);
      for (let i = 0; i < limit; i += 1) {
        const key = (start + i).toString(16).toUpperCase().padStart(hexLen, '0');
        const cp = dstStart + i;
        if (cp > 0) cidMap.set(key, String.fromCodePoint(cp));
      }
    }
  }
}

function decodePdfHexWithCMap(hex, cidMap) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (!clean) return '';

  if (cidMap && cidMap.size > 0) {
    let out4 = '';
    let hits4 = 0;
    const chunks4 = Math.floor(clean.length / 4);
    if (chunks4 > 0 && clean.length % 4 === 0) {
      for (let i = 0; i < clean.length; i += 4) {
        const token = clean.slice(i, i + 4);
        if (cidMap.has(token)) {
          out4 += cidMap.get(token);
          hits4 += 1;
        }
      }
      if (hits4 > 0) return out4;
    }

    let out2 = '';
    let hits2 = 0;
    if (clean.length % 2 === 0) {
      for (let i = 0; i < clean.length; i += 2) {
        const token = clean.slice(i, i + 2);
        if (cidMap.has(token)) {
          out2 += cidMap.get(token);
          hits2 += 1;
        } else {
          out2 += String.fromCharCode(parseInt(token, 16));
        }
      }
      if (hits2 > 0) return out2;
    }
  }

  return decodePdfHexString(clean);
}

function decodeTjArray(arrayText, cidMap) {
  let out = '';
  const parts = arrayText.match(/\((?:\\.|[^\\()])*\)|<[0-9a-fA-F\s]+>|-?\d+(?:\.\d+)?/g) || [];
  for (const part of parts) {
    if (part.startsWith('(') && part.endsWith(')')) {
      out += decodePdfLiteralString(part.slice(1, -1));
    } else if (part.startsWith('<') && part.endsWith('>')) {
      out += decodePdfHexWithCMap(part.slice(1, -1), cidMap);
    } else {
      const kern = Number(part);
      if (Number.isFinite(kern) && kern <= -120 && out && !out.endsWith(' ')) {
        out += ' ';
      }
    }
  }
  return out;
}

function extractTextOperatorsFromStream(content, globalCidMap = null, fontRefs = null, fontCmaps = null) {
  const lines = [];
  let currentLine = '';
  let currentY = null;
  let currentX = 0;
  let activeMap = globalCidMap;
  let pendingBuffer = '';

  const pushLine = () => {
    if (pendingBuffer) {
      currentLine += pendingBuffer;
      pendingBuffer = '';
    }
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    currentLine = '';
  };

  const tokens =
    content.match(
      /\/[A-Za-z0-9_.-]+\s+\d+(?:\.\d+)?\s+Tf|\[(?:[^\[\]]|\((?:\\.|[^\\()])*\)|<[0-9a-fA-F\s]+>)*\]\s*TJ|\((?:\\.|[^\\()])*\)|<[0-9a-fA-F\s]+>|(?:-?\d+(?:\.\d+)?\s+){5}-?\d+(?:\.\d+)?\s+Tm|-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+T[dD]|T\*|Tj|'|"/g,
    ) || [];

  for (const token of tokens) {
    if (token.endsWith('Tf') && token.startsWith('/')) {
      const fontName = token.slice(1).split(/\s+/)[0];
      const fontObjId = fontRefs?.[fontName];
      activeMap = (fontObjId && fontCmaps?.get(fontObjId)) || globalCidMap;
    } else if (token.endsWith('TJ') && token.startsWith('[')) {
      const inner = token.slice(1, token.lastIndexOf(']'));
      currentLine += pendingBuffer + decodeTjArray(inner, activeMap);
      pendingBuffer = '';
    } else if (token.startsWith('(') && token.endsWith(')')) {
      pendingBuffer += decodePdfLiteralString(token.slice(1, -1));
    } else if (token.startsWith('<') && token.endsWith('>')) {
      pendingBuffer += decodePdfHexWithCMap(token.slice(1, -1), activeMap);
    } else if (token === 'Tj') {
      currentLine += pendingBuffer;
      pendingBuffer = '';
    } else if (token === "'" || token === '"') {
      if (currentLine.trim()) lines.push(currentLine.trim());
      currentLine = pendingBuffer;
      pendingBuffer = '';
    } else if (token === 'T*') {
      pushLine();
    } else if (/\s+Tm$/.test(token)) {
      const nums = token.trim().split(/\s+/);
      const nextX = Number(nums[4]) || 0;
      const nextY = Number(nums[5]) || 0;
      if (pendingBuffer) {
        currentLine += pendingBuffer;
        pendingBuffer = '';
      }
      if (currentY !== null && Math.abs(nextY - currentY) > 2.5) {
        pushLine();
      } else if (currentLine && !currentLine.endsWith(' ') && nextX > currentX + 18) {
        currentLine += ' ';
      }
      currentX = nextX;
      currentY = nextY;
    } else if (/\s+T[dD]$/.test(token)) {
      const parts = token.trim().split(/\s+/);
      const dx = Number(parts[0]) || 0;
      const dy = Number(parts[1]) || 0;
      if (pendingBuffer) {
        currentLine += pendingBuffer;
        pendingBuffer = '';
      }
      if (Math.abs(dy) > 1.5) {
        pushLine();
        if (currentY !== null) currentY += dy;
      } else if (currentLine && !currentLine.endsWith(' ') && dx > 45) {
        currentLine += ' ';
      }
      currentX += dx;
    }
  }

  pushLine();
  return lines.join('\n');
}

function expandCompoundIngredientLine(rawLine) {
  let clean = String(rawLine || '')
    .replace(/^[-•*▪▫►]\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim();
  if (!clean) return [];

  // Ignorar notas de elaboración auxiliar tipo "Para hummus casero: ..."
  if (/^para\s+[^:]+:/i.test(clean)) {
    return [];
  }

  // Limpiar sufijos generales entre paréntesis al final antes de dividir cantidades múltiples
  clean = clean.replace(/\s*\([^)]*(?:rodajas?|de\s+cada|aprox)[^)]*\)\s*$/i, '').trim();

  // Dividir líneas compuestas cuando cada parte empieza con cantidad + unidad ("40 g de pimiento verde y 40 g de pimiento rojo")
  const splitParts = clean
    .split(
      /(?:\s*,\s*|\s+y\s+)(?=\s*\d+(?:[.,]\d+)?\s*(?:kg|g|gr|gramos|ml|l|litros?|ud|uds|unidades?|cda|cdas|cucharadas?|cdta|cdtas|cucharaditas?|dientes?|rebanadas?|tazas?)\b)/i,
    )
    .map((p) => p.trim())
    .filter(Boolean);

  const finalParts = [];
  for (const part of splitParts) {
    // Limpiar coletilla "... y especias al gusto (...)" cuando precede un ingrediente medido
    const cleanedPart = part
      .replace(/\s+y\s+(?:especias|hierbas(?:\s+arom[aá]ticas)?)\s+al\s+gusto(?:\s*\([^)]*\))?\s*$/i, '')
      .trim();
    if (cleanedPart) finalParts.push(cleanedPart);
  }

  return finalParts;
}

function parseIngredientLine(line) {
  let clean = String(line || '')
    .replace(/^[-•*▪▫►]\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim();
  if (!clean || clean.length < 2) return null;

  // Eliminar aclaraciones entre paréntesis al final, ej: "(1/4 de barra de 250 g)" o "(1 cda de postre)"
  const withoutTrailingNotes = clean.replace(/\s*\([^)]*\)\s*$/g, '').trim();
  const baseLine = withoutTrailingNotes || clean;

  // Formato: "300 g de garbanzos cocidos" o "2 zanahorias" o "200ml leche"
  const match = baseLine.match(
    /^(\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)\s*(kg|g|gr|gramos|ml|l|litros|ud|uds|unidades?|cda|cdas|cucharadas?|cdta|cdtas|cucharaditas?|taza|tazas|rebanada|rebanadas|diente|dientes|manojo|manojos|pizca|pizcas)?\s*(?:de\s+)?(.+)$/i,
  );

  let amount = 1;
  let unit = 'pizca';
  let name = baseLine;
  let keepFixed = true;

  if (match) {
    keepFixed = false;
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
    else if (/^pizcas?$/.test(rawUnit)) {
      unit = 'pizca';
      keepFixed = true;
    } else unit = 'ud';

    name = match[3].trim();
  }

  name = name.replace(/\s*\([^)]*\)\s*$/g, '').replace(/^[.,:\s]+|[.,:\s]+$/g, '');
  if (!name) return null;

  return {
    id: generateId('ing'),
    name: name.charAt(0).toUpperCase() + name.slice(1),
    amount,
    unit,
    keepFixed,
    category: categorizeIngredientName(name),
  };
}

function collapseSpacedLettersIfNeeded(line) {
  if (/^(?:[A-Za-zÁÉÍÓÚáéíóúÑñ]\s+){3,}[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(line)) {
    return line
      .replace(/ {2,}/g, '§§')
      .replace(/ (?=[A-Za-zÁÉÍÓÚáéíóúÑñ0-9,:.;!?()/-])/g, '')
      .replace(/§§/g, ' ');
  }
  return line;
}

function preprocessPdfLines(rawText = '') {
  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => collapseSpacedLettersIfNeeded(l.replace(/\s+/g, ' ').trim()))
    .filter(Boolean);

  const cleaned = [];
  const splitLabelRegex =
    /^(t[ií]tulo|receta|nombre|title|comida|categor[ií]a|tipo|tiempo|duraci[oó]n|prep|raciones|porciones|personas|comensales)\s*:\s*$/i;

  for (let i = 0; i < rawLines.length; i += 1) {
    // Descartar líneas de pie/cabecera de página tipo "Recetario Completo ... Page 1 of 27" o "Página 1 de 2"
    let line = rawLines[i].trim();
    if (
      !line ||
      /\b(?:page|p[áa]gina)\s+\d+\s+(?:of|de)\s+\d+\b/i.test(line) ||
      /^(?:page|p[áa]gina)\s+\d+$/i.test(line) ||
      /^recetario\s+completo\s*-\s*planes\s+diet[eé]ticos\b/i.test(line)
    ) {
      continue;
    }

    // Unir etiquetas partidas en dos líneas ("Titulo:\nTostada...")
    if (splitLabelRegex.test(line) && i + 1 < rawLines.length) {
      line = `${line} ${rawLines[i + 1].trim()}`;
      i += 1;
    }

    cleaned.push(line);
  }

  return cleaned;
}

export function parseRecipeTextToStructured(rawText = '', fileName = 'Receta PDF') {
  const lines = preprocessPdfLines(rawText);

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

    const servingsMeta =
      line.match(/(?:raciones|porciones|personas?|comensales|servings?)\s*[:\-]?\s*(\d+)/i) ||
      line.match(/para\s+(\d+)\s+(?:personas?|raciones?|comensales)/i) ||
      line.match(/^(\d+)\s+(?:personas?|raciones?|comensales)\b/i);
    if (servingsMeta && currentSection === 'header') {
      originalServings = Math.max(1, Number(servingsMeta[1]) || DEFAULT_SERVINGS);
      continue;
    }

    const timeMeta = line.match(/(?:tiempo|duraci[oó]n|prep)\s*[:\-]?\s*(\d+)\s*(?:min|minutos|m\b)/i);
    if (timeMeta && currentSection === 'header') {
      prepTime = Math.max(1, Number(timeMeta[1]) || 25);
      continue;
    }

    const mealMeta = line.match(/(?:comida|categor[ií]a|tipo)\s*[:\-]?\s*(desayuno|merienda|comida|almuerzo|cena)/i);
    if (mealMeta) {
      const m = mealMeta[1].toLowerCase();
      if (m === 'almuerzo') mealCategory = 'comida';
      else if (m === 'merienda') mealCategory = 'desayuno';
      else mealCategory = m;
      continue;
    }

    // Ignorar pie de página si repite exactamente el título fuera de la cabecera
    if (currentSection !== 'header' && title && line.toLowerCase() === title.toLowerCase()) {
      continue;
    }

    if (currentSection === 'header') {
      if (!title && line.length >= 3 && line.length <= 120) {
        title = line;
      } else if (!description && line.length > 10) {
        description = line;
      }
    } else if (currentSection === 'ingredients') {
      if (/^(preparaci[oó]n|elaboraci[oó]n|pasos|instrucciones)\s*:/i.test(lower)) {
        currentSection = 'steps';
        const after = line.split(':').slice(1).join(':').trim();
        if (after) rawStepLines.push(after);
      } else if (
        !/^[-•*▪▫►]/.test(line) &&
        !/^\d/.test(line) &&
        rawIngredientLines.length > 0
      ) {
        // Línea envuelta continuación del ingrediente anterior
        rawIngredientLines[rawIngredientLines.length - 1] =
          `${rawIngredientLines[rawIngredientLines.length - 1]} ${line}`.trim();
      } else {
        rawIngredientLines.push(line);
      }
    } else if (currentSection === 'steps') {
      const numberedMatch = line.match(/^\d+[.)]\s*(.+)$/);
      if (numberedMatch) {
        rawStepLines.push(numberedMatch[1].trim());
      } else if (rawStepLines.length > 0) {
        rawStepLines[rawStepLines.length - 1] = `${rawStepLines[rawStepLines.length - 1]} ${line}`.trim();
      } else {
        rawStepLines.push(line);
      }
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

  const noteExtras = [];
  const expandedIngLines = [];
  for (const rawIng of rawIngredientLines) {
    const cleanRaw = rawIng.replace(/^[-•*▪▫►]\s*/, '').trim();
    if (/^para\s+[^:]+:/i.test(cleanRaw)) {
      noteExtras.push(cleanRaw);
    } else {
      expandedIngLines.push(...expandCompoundIngredientLine(rawIng));
    }
  }

  const parsedIngredients = expandedIngLines
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
      noteExtras.join(' · ') ||
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

export function parseMultipleRecipesFromText(rawText = '', fileName = 'Receta PDF') {
  const lines = preprocessPdfLines(rawText);

  if (lines.length === 0) return [];

  const titleLineRegex = /^(?:t[ií]tulo|receta|nombre|title)\s*:\s*(.+)$/i;
  const ingredientsHeaderRegex = /^(?:ingredientes|ingredients)\b[:\s-]*$/i;
  const separatorRegex = /^[-=_*]{3,}$/;

  const titleIndices = [];
  lines.forEach((line, idx) => {
    if (titleLineRegex.test(line)) {
      titleIndices.push(idx);
    }
  });

  let blocks = [];

  if (titleIndices.length >= 2) {
    for (let i = 0; i < titleIndices.length; i += 1) {
      const start = titleIndices[i];
      const end = i + 1 < titleIndices.length ? titleIndices[i + 1] : lines.length;
      blocks.push(lines.slice(start, end).join('\n'));
    }
  } else if (lines.some((l) => separatorRegex.test(l))) {
    let current = [];
    for (const line of lines) {
      if (separatorRegex.test(line)) {
        if (current.length > 0) {
          blocks.push(current.join('\n'));
          current = [];
        }
      } else {
        current.push(line);
      }
    }
    if (current.length > 0) blocks.push(current.join('\n'));
  } else {
    const ingIndices = [];
    lines.forEach((line, idx) => {
      if (ingredientsHeaderRegex.test(line)) {
        ingIndices.push(idx);
      }
    });

    if (ingIndices.length >= 2) {
      const splitStarts = [0];
      for (let i = 1; i < ingIndices.length; i += 1) {
        let candidate = ingIndices[i];
        // Retroceder hasta 4 líneas buscando el inicio del encabezado (Título / Para X personas / Comida / Tiempo)
        for (let step = 1; step <= 4 && candidate - 1 > splitStarts[splitStarts.length - 1]; step += 1) {
          const prevLine = lines[candidate - 1];
          if (/^\d+[.)]\s+/.test(prevLine) || /^[-•*]\s+/.test(prevLine)) {
            break;
          }
          candidate -= 1;
          if (titleLineRegex.test(prevLine) || (!/:/.test(prevLine) && prevLine.length <= 80)) {
            break;
          }
        }
        splitStarts.push(candidate);
      }

      for (let i = 0; i < splitStarts.length; i += 1) {
        const start = splitStarts[i];
        const end = i + 1 < splitStarts.length ? splitStarts[i + 1] : lines.length;
        blocks.push(lines.slice(start, end).join('\n'));
      }
    } else {
      blocks = [lines.join('\n')];
    }
  }

  return blocks
    .map((blockText, idx) => {
      const fallbackName =
        blocks.length > 1
          ? `${fileName.replace(/\.pdf$/i, '')} (${idx + 1})`
          : fileName;
      const parsed = parseRecipeTextToStructured(blockText, fallbackName);
      return {
        ...parsed,
        sourceFile: fileName,
      };
    })
    .filter((entry) => entry.recipe && entry.recipe.name);
}

// ============================================================================
// 2B. DETECCIÓN DE RECETAS REPETIDAS O PRÁCTICAMENTE IGUALES
// ============================================================================

const TITLE_STOPWORDS = new Set([
  'de', 'del', 'con', 'sin', 'al', 'a', 'la', 'el', 'los', 'las', 'y', 'e', 'o',
  'en', 'para', 'por', 'un', 'una', 'unos', 'unas', 'estilo', 'casero', 'casera',
  'receta', 'express', 'expres', 'rapida', 'rapido', 'tradicional', 'gourmet',
  'air', 'fryer', 'especias', 'natural',
]);

const MINOR_CONDIMENT_KEYS = new Set([
  'sal', 'agua', 'aceite de oliva', 'pimienta', 'pimienta negra', 'pimienta blanca',
  'ajo', 'ajo en polvo', 'cebolla en polvo', 'perejil', 'perejil fresco', 'oregano',
  'tomillo', 'romero', 'comino', 'laurel', 'clavo', 'nuez moscada', 'vinagre',
  'pimenton', 'pimenton dulce', 'hierbas provenzales', 'albahaca', 'curcuma',
  'jengibre', 'cilantro', 'cilantro fresco', 'especias', 'sazonador',
]);

function stripAccentsLower(str = '') {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function normalizeRecipeTitleForComparison(title = '') {
  const cleaned = stripAccentsLower(title)
    .replace(/\baove\b/g, 'aceite oliva')
    .replace(/["'“”‘’().,:;!?/\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(Boolean);
  const meaningful = words.filter((w) => w.length >= 2 && !TITLE_STOPWORDS.has(w));
  return {
    normalizedText: words.join(' '),
    meaningfulText: meaningful.join(' '),
    tokens: new Set(meaningful),
  };
}

function getCoreIngredientSet(recipe) {
  const full = new Set();
  const core = new Set();
  for (const ing of recipe?.ingredients || []) {
    const { key } = canonicalizeIngredientName(ing.name || '');
    if (!key) continue;
    full.add(key);
    const isMinor =
      MINOR_CONDIMENT_KEYS.has(key) ||
      /\b(especias|hierbas|sal |vinagre|ajo en polvo|pimienta)\b/.test(key);
    if (!isMinor) {
      core.add(key);
    }
  }
  return core.size > 0 ? core : full;
}

function jaccardSimilarity(setA, setB) {
  if (!setA.size || !setB.size) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

export function computeRecipeSimilarity(recipeA, recipeB) {
  if (!recipeA || !recipeB) return { isDuplicate: false, score: 0, reason: '' };

  const tA = normalizeRecipeTitleForComparison(recipeA.name);
  const tB = normalizeRecipeTitleForComparison(recipeB.name);

  if (tA.normalizedText && tA.normalizedText === tB.normalizedText) {
    return { isDuplicate: true, score: 1, reason: 'Mismo título' };
  }

  if (tA.meaningfulText && tA.meaningfulText === tB.meaningfulText) {
    return { isDuplicate: true, score: 0.96, reason: 'Título prácticamente idéntico' };
  }

  const titleSim = jaccardSimilarity(tA.tokens, tB.tokens);
  const coreA = getCoreIngredientSet(recipeA);
  const coreB = getCoreIngredientSet(recipeB);
  const ingSim = jaccardSimilarity(coreA, coreB);

  const sameMeal =
    !recipeA.mealCategory ||
    !recipeB.mealCategory ||
    recipeA.mealCategory === recipeB.mealCategory;

  if (titleSim >= 0.72 && (coreA.size === 0 || coreB.size === 0 || ingSim >= 0.5)) {
    return { isDuplicate: true, score: Math.max(titleSim, ingSim), reason: 'Título muy similar' };
  }

  if (ingSim >= 0.85 && sameMeal && titleSim >= 0.3) {
    return { isDuplicate: true, score: ingSim, reason: 'Mismos ingredientes principales' };
  }

  if (titleSim >= 0.45 && ingSim >= 0.72) {
    return {
      isDuplicate: true,
      score: Math.round(((titleSim + ingSim) / 2) * 100) / 100,
      reason: 'Ingredientes y preparación equivalentes',
    };
  }

  return { isDuplicate: false, score: Math.max(titleSim, ingSim), reason: '' };
}

export function findDuplicateOrSimilarRecipe(candidateRecipe, existingRecipes = []) {
  let best = null;
  for (const existing of existingRecipes) {
    if (!existing || existing.id === candidateRecipe?.id) continue;
    const sim = computeRecipeSimilarity(candidateRecipe, existing);
    if (sim.isDuplicate && (!best || sim.score > best.score)) {
      best = {
        matchedRecipe: existing,
        score: sim.score,
        reason: sim.reason,
      };
    }
  }
  return best;
}

export function findDuplicateGroupsInRecipes(recipes = []) {
  const duplicatePairs = [];
  for (let i = 0; i < recipes.length; i += 1) {
    for (let j = i + 1; j < recipes.length; j += 1) {
      const sim = computeRecipeSimilarity(recipes[i], recipes[j]);
      if (sim.isDuplicate) {
        duplicatePairs.push({
          keep: recipes[i],
          duplicate: recipes[j],
          score: sim.score,
          reason: sim.reason,
        });
      }
    }
  }
  return duplicatePairs;
}

async function decodeStreamBytesWithDict(streamBytes, dict) {
  if (/\/FlateDecode/i.test(dict)) {
    const inflated = await decompressFlateBytes(streamBytes);
    return inflated ? bytesToLatin1(inflated) : '';
  }
  return bytesToLatin1(streamBytes);
}

export async function extractRawTextFromPdfFile(file) {
  if (!file) {
    throw new Error('No se ha seleccionado ningún archivo PDF.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const latin1 = bytesToLatin1(bytes);

  // 1. Intentar lectura ordenada por árbol de páginas (/Catalog -> /Pages -> /Page) y fuentes por página
  const objs = new Map();
  const objRegex = /(\d+)\s+0\s+obj\b([\s\S]*?)endobj/g;
  let objMatch;
  while ((objMatch = objRegex.exec(latin1)) !== null) {
    const objId = Number(objMatch[1]);
    const bodyStart = objMatch.index + objMatch[0].indexOf(objMatch[2]);
    objs.set(objId, { body: objMatch[2], bodyStart });
  }

  const extractStreamSliceWithLength = (dict, startIdx, endIdx) => {
    const lenMatch = dict.match(/\/Length\s+(\d+)\b/);
    if (lenMatch) {
      const declaredLen = Number(lenMatch[1]);
      if (declaredLen > 0 && startIdx + declaredLen <= endIdx) {
        return bytes.subarray(startIdx, startIdx + declaredLen);
      }
    }
    let slice = bytes.subarray(startIdx, endIdx);
    if (slice.length >= 2 && slice[slice.length - 2] === 13 && slice[slice.length - 1] === 10) {
      slice = slice.subarray(0, slice.length - 2);
    } else if (slice.length >= 1 && (slice[slice.length - 1] === 10 || slice[slice.length - 1] === 13)) {
      slice = slice.subarray(0, slice.length - 1);
    }
    return slice;
  };

  const decodeObjectStream = async (objId) => {
    const entry = objs.get(objId);
    if (!entry) return '';
    const streamHeader = entry.body.match(/<<([\s\S]*?)>>\s*stream(?:\r\n|\n|\r)/);
    if (!streamHeader) return '';
    const dict = streamHeader[1];
    const relStart = entry.body.indexOf(streamHeader[0]) + streamHeader[0].length;
    const relEnd = entry.body.lastIndexOf('endstream');
    if (relEnd <= relStart) return '';
    const slice = extractStreamSliceWithLength(dict, entry.bodyStart + relStart, entry.bodyStart + relEnd);
    return decodeStreamBytesWithDict(slice, dict);
  };

  const globalCidMap = new Map();
  const fontCmaps = new Map();

  for (const [objId, entry] of objs.entries()) {
    const toUniMatch = entry.body.match(/\/ToUnicode\s+(\d+)\s+0\s+R/);
    if (toUniMatch) {
      const cmapText = await decodeObjectStream(Number(toUniMatch[1]));
      if (cmapText) {
        const fontMap = new Map();
        parseToUnicodeCMap(cmapText, fontMap);
        parseToUnicodeCMap(cmapText, globalCidMap);
        fontCmaps.set(objId, fontMap);
      }
    }
  }

  const orderedPageContents = [];
  const resolveFontRefs = (pageBody) => {
    const refs = {};
    const fontDictMatch = pageBody.match(/\/Font\s*<<([\s\S]*?)>>/);
    if (fontDictMatch) {
      for (const rm of fontDictMatch[1].matchAll(/\/([A-Za-z0-9_.-]+)\s+(\d+)\s+0\s+R/g)) {
        refs[rm[1]] = Number(rm[2]);
      }
    }
    return refs;
  };

  const collectPages = async (nodeId, inheritedFontRefs = {}) => {
    const entry = objs.get(nodeId);
    if (!entry) return;
    const body = entry.body;
    const nodeFontRefs = { ...inheritedFontRefs, ...resolveFontRefs(body) };

    const kidsMatch = body.match(/\/Kids\s*\[([^\]]+)\]/);
    if (kidsMatch && !/\/Contents\b/.test(body)) {
      for (const km of kidsMatch[1].matchAll(/(\d+)\s+0\s+R/g)) {
        await collectPages(Number(km[1]), nodeFontRefs);
      }
      return;
    }

    if (/\/Contents\b/.test(body)) {
      const arrayMatch = body.match(/\/Contents\s*\[([^\]]+)\]/);
      const singleMatch = body.match(/\/Contents\s+(\d+)\s+0\s+R/);
      const contentIds = arrayMatch
        ? Array.from(arrayMatch[1].matchAll(/(\d+)\s+0\s+R/g)).map((m) => Number(m[1]))
        : singleMatch
          ? [Number(singleMatch[1])]
          : [];

      const parts = [];
      for (const cid of contentIds) {
        const decoded = await decodeObjectStream(cid);
        if (decoded && (decoded.includes('Tj') || decoded.includes('TJ') || decoded.includes('BT'))) {
          parts.push(extractTextOperatorsFromStream(decoded, globalCidMap, nodeFontRefs, fontCmaps));
        }
      }
      const joined = parts.filter(Boolean).join('\n');
      if (joined.trim()) orderedPageContents.push(joined);
    }
  };

  for (const [, entry] of objs.entries()) {
    if (/\/Type\s*\/Catalog\b/.test(entry.body)) {
      const pagesRef = entry.body.match(/\/Pages\s+(\d+)\s+0\s+R/);
      if (pagesRef) {
        await collectPages(Number(pagesRef[1]));
      }
      break;
    }
  }

  let combinedText = orderedPageContents.join('\n').trim();

  // 2. Fallback por escaneo directo de flujos (PDFs simples o sin /Catalog estándar)
  if (!combinedText) {
    const decodedStreams = [];
    const streamRegex = /<<([\s\S]*?)>>\s*stream\r?\n([\s\S]*?)endstream/g;
    let match;

    while ((match = streamRegex.exec(latin1)) !== null) {
      const dict = match[1];
      const streamStart = match.index + match[0].indexOf('stream');
      const afterStreamKeyword = latin1.slice(streamStart, streamStart + 10);
      const headerOffset = afterStreamKeyword.startsWith('stream\r\n') ? 8 : 7;
      const rawStart = streamStart + headerOffset;
      const rawEnd = match.index + match[0].length - 'endstream'.length;

      const streamBytes = extractStreamSliceWithLength(dict, rawStart, rawEnd);

      const decodedText = await decodeStreamBytesWithDict(streamBytes, dict);
      if (!decodedText) continue;

      if (
        decodedText.includes('begincmap') ||
        decodedText.includes('beginbfchar') ||
        decodedText.includes('beginbfrange')
      ) {
        parseToUnicodeCMap(decodedText, globalCidMap);
      } else if (decodedText.includes('Tj') || decodedText.includes('TJ') || decodedText.includes('BT')) {
        decodedStreams.push(decodedText);
      }
    }

    const extractedChunks = decodedStreams
      .map((streamText) => extractTextOperatorsFromStream(streamText, globalCidMap))
      .filter((chunk) => chunk && chunk.trim());

    if (extractedChunks.length === 0) {
      const fallback = extractTextOperatorsFromStream(latin1, globalCidMap);
      if (fallback.trim()) {
        extractedChunks.push(fallback);
      }
    }

    combinedText = extractedChunks.join('\n').trim();
  }

  if (!combinedText) {
    throw new Error(
      `No se pudo extraer texto legible de "${file.name}" (puede ser una imagen escaneada).`,
    );
  }

  return combinedText;
}

export async function extractRecipeFromPdf(file) {
  const combinedText = await extractRawTextFromPdfFile(file);
  return parseRecipeTextToStructured(combinedText, file.name);
}

export async function extractRecipesFromPdfFiles(files, existingRecipes = []) {
  const fileList = Array.from(files || []).filter(Boolean);
  const items = [];
  const errors = [];
  const existingSnapshot = Array.isArray(existingRecipes) ? [...existingRecipes] : [];
  const seenBatchRecipes = [];

  for (const file of fileList) {
    try {
      const rawText = await extractRawTextFromPdfFile(file);
      const parsedList = parseMultipleRecipesFromText(rawText, file.name);
      if (parsedList.length === 0) {
        errors.push({ fileName: file.name, message: 'No se detectaron recetas válidas.' });
      } else {
        for (const entry of parsedList) {
          const dupExisting = findDuplicateOrSimilarRecipe(entry.recipe, existingSnapshot);
          const dupBatch = !dupExisting
            ? findDuplicateOrSimilarRecipe(entry.recipe, seenBatchRecipes)
            : null;
          const dupMatch = dupExisting || dupBatch;

          seenBatchRecipes.push(entry.recipe);

          items.push({
            ...entry,
            isDuplicate: Boolean(dupMatch),
            duplicateOf: dupMatch?.matchedRecipe?.name || '',
            duplicateSource: dupExisting ? 'ya guardada en tu recetario' : dupBatch ? 'duplicada en este PDF' : '',
            duplicateReason: dupMatch?.reason || '',
          });
        }
      }
    } catch (err) {
      errors.push({
        fileName: file.name,
        message: err.message || 'No se pudo leer el archivo PDF.',
      });
    }
  }

  return { items, errors };
}

function escapePdfString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Genera un archivo PDF válido de ejemplo con 3 recetas para probar la importación múltiple.
 * Incluye recetas de 4 y 2 personas para demostrar el reescalado automático a 2 personas.
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
    'Preparacion:',
    '1. Cortar las patatas y la cebolla en rodajas finas y hornear 15 minutos a 190 C.',
    '2. Colocar los lomos de merluza encima con rodajas de limon y hornear 12 minutos.',
    'Titulo: Garbanzos salteados con acelgas y pimenton',
    'Comida: comida',
    'Tiempo: 20 min',
    'Para 4 personas',
    'Ingredientes:',
    '- 800 g de garbanzos cocidos',
    '- 400 g de acelgas frescas',
    '- 4 diente de ajo',
    '- 2 cdta de pimenton dulce',
    'Preparacion:',
    '1. Rehogar los ajos laminados con el pimenton y saltear las acelgas troceadas.',
    '2. Incorporar los garbanzos cocidos y cocinar 5 minutos.',
    'Titulo: Pechuga de pavo a la plancha con calabacin',
    'Comida: cena',
    'Tiempo: 15 min',
    'Para 2 personas',
    'Ingredientes:',
    '- 300 g de pechuga de pavo',
    '- 1 ud de calabacin',
    '- 2 cda de aceite de oliva virgen',
    'Preparacion:',
    '1. Cortar el calabacin en rodajas y dorar a la plancha junto con el pavo.',
  ];

  const ops = ['BT', '/F1 10 Tf', '40 800 Td', '14 TL'];
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
      var qtyStr = item.amountDisplay || (item.amount > 0 ? item.amount + ' ' + item.unit : '');
      var qty = qtyStr ? ' — ' + qtyStr : '';
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
      const qtyText = getShoppingItemAmountDisplay(item);
      const qty = qtyText ? ` — ${qtyText}` : '';
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
            const qtyText = getShoppingItemAmountDisplay(item);
            const qty = qtyText
              ? ` <span style="color:#475569;">— ${qtyText}</span>`
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
        amountDisplay: getShoppingItemAmountDisplay(item),
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
