/**
 * Сервис для взаимодействия с Google Gemini API.
 * Реализована агрессивная система Fallback: перебор всех доступных моделей
 * при ЛЮБОЙ ошибке (лимиты, ошибки сервера, несовместимость).
 */

const API_KEY = "AIzaSyBzHgklEQ0stvu1d0HYjLv_cjdPdideOLs";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Расширенный список моделей в порядке приоритета.
const MODELS = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-3-flash",
    "gemma-3-27b",
    "gemma-3-12b",
    "gemma-3-4b",
    "gemma-3-2b",
    "gemini-pro"
];

const commonInstructions = `
Отвечай как профессиональный AI-ассистент (стиль Claude/ChatGPT). 
Используй Markdown разметку, заголовки, списки. 
Отвечай на русском языке. Структурируй ответ.
`;

const prompts = {
    explain: `${commonInstructions}\nОбъясни логику кода по шагам.`,
    bugs: `${commonInstructions}\nНайди баги и уязвимости.`,
    refactor: `${commonInstructions}\nПредложи современный рефакторинг.`
};

const fetchFromModel = async (modelName, code, mode) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 секунд на модель

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
                    maxOutputTokens: 2048,
                }
            })
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.error?.message || `HTTP ${response.status}`;
            throw new Error(message);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) throw new Error("EMPTY_RESPONSE");

        return content;
    } catch (e) {
        clearTimeout(timeoutId);
        throw e;
    }
};

export const simulateAiAnalysis = async (code, mode) => {
    let errors = [];

    for (const modelName of MODELS) {
        try {
            console.log(`[AI] Попытка через ${modelName}...`);
            const aiText = await fetchFromModel(modelName, code, mode);

            return {
                title: mode === 'explain' ? 'Технический анализ' : mode === 'bugs' ? 'Аудит безопасности' : 'Рефакторинг',
                content: aiText,
                model: modelName
            };
        } catch (error) {
            const errorMsg = error.name === 'AbortError' ? 'Таймаут' : error.message;
            console.warn(`[AI] Ошибка ${modelName}: ${errorMsg}`);
            errors.push(`${modelName}: ${errorMsg}`);
            // Продвигаемся к следующей модели при ЛЮБОЙ ошибке
            continue;
        }
    }

    // Если все модели вернули ошибку
    return {
        title: "Ошибка Intelligence",
        content: `### Не удалось получить ответ\n\nПриложение попробовало все доступные нейросети (${MODELS.length} шт.), но они вернули ошибки или лимиты исчерпаны.\n\n**Детали ошибок:**\n\n- ${errors.join('\n- ')}\n\n*Попробуйте сократить размер кода или повторить попытку через минуту.*`,
        model: "Service Failure"
    };
};
