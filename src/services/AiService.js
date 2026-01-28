/**
 * Сервис для взаимодействия с Google Gemini API.
 * Использует v1beta для поддержки новейших моделей.
 * Реализована максимальная отказоустойчивость: пробует все модели при любой ошибке.
 */

const API_KEY = "AIzaSyBzHgklEQ0stvu1d0HYjLv_cjdPdideOLs";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Полный список моделей для перебора
const MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-3-flash",
    "gemma-3-27b",
    "gemma-3-12b",
    "gemma-3-4b",
    "gemma-3-2b",
    "gemma-3-1b",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-pro",
    "gemini-2.5-flash-tts",
    "gemini-robotics-er-1.5-preview"
];

const commonInstructions = `
Отвечай в стиле профессионального AI-ассистента (как Claude или ChatGPT). 
Используй богатую разметку Markdown. Отвечай на русском языке.
Разбивай ответ на логические блоки: Вступление, Анализ, Резюме.
`;

const prompts = {
    explain: `${commonInstructions}\nПОШАГОВО ОБЪЯСНИ логику этого кода.`,
    bugs: `${commonInstructions}\nНайди уязвимости и баги. Оформи списком с приоритетами.`,
    refactor: `${commonInstructions}\nПредложи ЭЛИТНЫЙ РЕФАКТОРИНГ (современный стандарт).`
};

const fetchFromModel = async (modelName, code, mode) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд на модель

    try {
        const url = `${BASE_URL}/${modelName}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${prompts[mode] || prompts.explain}\n\nКОД ДЛЯ АНАЛИЗА:\n\`\`\`\n${code}\n\`\`\`` }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2500,
                }
            })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json();
            const errMsg = errorData.error?.message || "API_ERROR";
            throw new Error(errMsg);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (e) {
        clearTimeout(timeoutId);
        throw e;
    }
};

export const simulateAiAnalysis = async (code, mode) => {
    let lastError = null;

    for (const modelName of MODELS) {
        try {
            console.log(`Проверка модели: ${modelName}...`);
            const aiText = await fetchFromModel(modelName, code, mode);

            if (aiText) {
                return {
                    title: mode === 'explain' ? 'Технический разбор' : mode === 'bugs' ? 'Анализ безопасности' : 'План рефакторинга',
                    content: aiText,
                    model: modelName
                };
            }
        } catch (error) {
            lastError = error;
            console.error(`Ошибка модели ${modelName}:`, error.message);
            // Пытаемся следующую модель несмотря ни на что
            continue;
        }
    }

    return {
        title: "Ошибка лимитов",
        content: `⚠️ К сожалению, все доступные на данный момент модели ответили отказом из-за исчерпания общих лимитов API. \n\n**Последняя ошибка:** \`${lastError?.message}\`\n\nПожалуйста, подождите 1-5 минут и попробуйте снова.`
    };
};
