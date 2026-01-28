/**
 * Сервис для взаимодействия с Google Gemini API.
 * Оптимизирован для максимальной скорости ответа.
 */

const API_KEY = "AIzaSyBzHgklEQ0stvu1d0HYjLv_cjdPdideOLs";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Оптимизированный список: Сначала самые стабильные и быстрые, чтобы избежать задержек при переключении.
const MODELS = [
    "gemini-2.5-flash",        // Приоритет №1: Самая быстрая и стабильная
    "gemini-2.5-flash-lite",   // Приоритет №2
    "gemini-1.5-flash",
    "gemini-3-flash",          // Экспериментальная
    "gemma-3-27b",
    "gemma-3-12b",
    "gemini-pro"
];

const commonInstructions = `
Отвечай кратко, но профессионально. Используй Markdown. Отвечай на русском языке.
`;

const prompts = {
    explain: `${commonInstructions}\nПОШАГОВО ОБЪЯСНИ логику этого кода.`,
    bugs: `${commonInstructions}\nНайди уязвимости и баги. Оформи списком.`,
    refactor: `${commonInstructions}\nПредложи РЕФАКТОРИНГ (современный стиль).`
};

const fetchFromModel = async (modelName, code, mode) => {
    // Устанавливаем таймаут, чтобы не ждать "зависшие" модели слишком долго
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 секунд на попытку

    try {
        const url = `${BASE_URL}/${modelName}:generateContent?key=${API_KEY}`;
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${prompts[mode] || prompts.explain}\n\nКОД:\n\`\`\`\n${code}\n\`\`\`` }]
                }],
                generationConfig: {
                    temperature: 0.6,
                    maxOutputTokens: 2000,
                }
            })
        });

        clearTimeout(timeoutId);

        if (response.status === 429) throw new Error("RATE_LIMIT");
        if (response.status === 404) throw new Error("MODEL_NOT_FOUND");
        if (!response.ok) throw new Error("API_ERROR");

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
            const aiText = await fetchFromModel(modelName, code, mode);
            if (aiText) {
                return {
                    title: mode === 'explain' ? 'Разбор' : mode === 'bugs' ? 'Аудит' : 'Рефакторинг',
                    content: aiText,
                    model: modelName
                };
            }
        } catch (error) {
            lastError = error;
            if (error.name === 'AbortError' || error.message === "RATE_LIMIT" || error.message === "MODEL_NOT_FOUND") {
                console.warn(`Пропуск ${modelName}: ${error.message || 'Таймаут'}`);
                continue;
            }
            break;
        }
    }

    return {
        title: "Ошибка",
        content: `Не удалось получить ответ. Лимиты исчерпаны или сеть занята. (${lastError?.message})`
    };
};
