/**
 * Sketch Ideas Constants
 * 定义所有与线稿相关的常量
 */

// 难度级别
export const DIFFICULTY_LEVELS = ['warmup', 'sketch', 'challenge'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

// 难度显示名称
export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  warmup: 'Warm-up',
  sketch: 'Sketch',
  challenge: 'Challenge',
};

// 难度 emoji
export const DIFFICULTY_EMOJIS: Record<DifficultyLevel, string> = {
  warmup: '🔥',
  sketch: '✏️',
  challenge: '⚡',
};

// 分类列表（与 lineart 目录对应）
export const SKETCH_CATEGORIES = [
  'random',
  'animals',
  'anime_bleach',
  'anime_characters',
  'anime_characters_ancient',
  'anime_characters_full_body',
  'anime_chibi',
  'anime_naruto',
  'dynamic_sketches',
  'flowers',
  'flowers_birds',
  'flowers_plants_trees',
  'food',
  'forest',
  'kids_cartoons',
  'objects_scenes',
  'ocean',
  'pen_control_practice',
  'toddler_cartoons',
] as const;
export type SketchCategory = (typeof SKETCH_CATEGORIES)[number];

// 分类显示名称
export const CATEGORY_LABELS: Record<SketchCategory, string> = {
  random: 'Random',
  animals: 'Animals',
  anime_bleach: 'Anime Bleach',
  anime_characters: 'Anime Characters',
  anime_characters_ancient: 'Ancient Style Characters',
  anime_characters_full_body: 'Full Body Characters',
  anime_chibi: 'Chibi Characters',
  anime_naruto: 'Naruto Anime',
  dynamic_sketches: 'Dynamic Sketches',
  flowers: 'Flowers',
  flowers_birds: 'Flowers and Birds',
  flowers_plants_trees: 'Plants and Trees',
  food: 'Food',
  forest: 'Forest',
  kids_cartoons: 'Kids Cartoons',
  objects_scenes: 'Objects and Scenes',
  ocean: 'Ocean',
  pen_control_practice: 'Pen Control Practice',
  toddler_cartoons: 'Toddler Cartoons',
};

// lineart 目录名到数据库 category 的映射
export const DIR_TO_CATEGORY_MAP: Record<string, SketchCategory> = {
  'Animals': 'animals',
  'Anime_Bleach': 'anime_bleach',
  'Anime_Characters': 'anime_characters',
  'Anime_Characters_Ancient_Style': 'anime_characters_ancient',
  'Anime_Characters_Full_Body': 'anime_characters_full_body',
  'Anime_Chibi': 'anime_chibi',
  'Anime_Naruto': 'anime_naruto',
  'Dynamic_Sketches': 'dynamic_sketches',
  'Flowers': 'flowers',
  'Flowers_and_Birds': 'flowers_birds',
  'Flowers_Plants_and_Trees': 'flowers_plants_trees',
  'Food': 'food',
  'Forest': 'forest',
  'Kids_Cartoons': 'kids_cartoons',
  'Objects_and_Scenes': 'objects_scenes',
  'Ocean': 'ocean',
  'Pen_Control_Practice': 'pen_control_practice',
  'Toddler_Cartoons': 'toddler_cartoons',
};

// 根据文件名分配难度的规则
export const DIFFICULTY_RULES = {
  // 简单：数字 1-30，包含 simple, basic, easy
  easy: [
    /\d{1,2}[._]/, // 1-29 开头的文件
    /simple|basic|easy|beginner/i,
  ],
  // 中等：数字 30-70，包含 medium, sketch
  medium: [
    /\d{2}[._]/, // 30-99 开头的文件
    /medium|sketch|practice/i,
  ],
  // 困难：包含 complex, challenge, hard
  hard: [
    /complex|challenge|hard|advanced|difficult/i,
  ],
};

// 默认 prompt 模板
export const PROMPT_TEMPLATES: Record<SketchCategory, string[]> = {
  random: [
    'Practice your sketching skills with this reference',
    'Study the form and structure of this subject',
    'Focus on capturing the essence and movement',
  ],
  animals: [
    'Study the animal\'s posture and gesture',
    'Pay attention to the flow of the fur and body contours',
    'Capture the expression and character of this animal',
  ],
  anime_bleach: [
    'Practice dynamic character poses and action lines',
    'Study the clothing folds and fabric movement',
    'Focus on facial expressions and emotional intensity',
  ],
  anime_characters: [
    'Practice character proportions and anatomy',
    'Study hair movement and styling',
    'Focus on capturing personality through pose',
  ],
  anime_characters_ancient: [
    'Practice flowing robes and traditional clothing',
    'Study graceful poses and elegant movements',
    'Focus on cultural details and accessories',
  ],
  anime_characters_full_body: [
    'Practice full-body character proportions',
    'Study weight distribution and balance',
    'Focus on dynamic stance and posture',
  ],
  anime_chibi: [
    'Practice cute proportions and simplified forms',
    'Study expressive faces and emotions',
    'Focus on charm through simplicity',
  ],
  anime_naruto: [
    'Practice ninja action poses and movement',
    'Study character-specific clothing and equipment',
    'Focus on dynamic composition and energy',
  ],
  dynamic_sketches: [
    'Capture the motion and energy of this pose',
    'Practice quick gesture drawing techniques',
    'Study the flow of action lines',
  ],
  flowers: [
    'Study the delicate structure of petals',
    'Practice organic curves and natural forms',
    'Focus on light and shadow on soft surfaces',
  ],
  flowers_birds: [
    'Practice combining static and dynamic elements',
    'Study bird anatomy and feather textures',
    'Focus on composition with multiple subjects',
  ],
  flowers_plants_trees: [
    'Practice drawing foliage and textured bark',
    'Study organic branching patterns',
    'Focus on depth and layering in nature',
  ],
  food: [
    'Practice rendering different food textures',
    'Study simple geometric forms in objects',
    'Focus on lighting and reflections',
  ],
  forest: [
    'Practice creating depth with layered elements',
    'Study tree variety and natural composition',
    'Focus on atmosphere and mood',
  ],
  kids_cartoons: [
    'Practice simple, appealing character designs',
    'Study clean lines and basic shapes',
    'Focus on fun and expressive poses',
  ],
  objects_scenes: [
    'Practice perspective and spatial relationships',
    'Study light and shadow on forms',
    'Focus on composition and balance',
  ],
  ocean: [
    'Practice drawing water and waves',
    'Study marine life and underwater forms',
    'Focus on movement and fluid dynamics',
  ],
  pen_control_practice: [
    'Focus on steady hand movements',
    'Practice consistent line weight and pressure',
    'Build muscle memory with these exercises',
  ],
  toddler_cartoons: [
    'Practice very simple character shapes',
    'Study minimal line art techniques',
    'Focus on creating cute, approachable designs',
  ],
};
