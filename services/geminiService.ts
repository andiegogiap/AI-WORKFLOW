import { GoogleGenAI, Type } from "@google/genai";
import { Workflow, Step, Phase, SuggestionsResponse } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// --- Main Workflow Parsing ---

const workflowSchema = {
  type: Type.OBJECT,
  properties: {
    phases: {
      type: Type.ARRAY,
      description: "An array of project phases.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique identifier for the phase, e.g., 'phase-i'." },
          title: { type: Type.STRING, description: "The title of the project phase." },
          steps: {
            type: Type.ARRAY,
            description: "An array of steps or tasks within this phase.",
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: "A unique identifier for the step, e.g., 'step-1-1'." },
                title: { type: Type.STRING, description: "A short title for the step, derived from the 'Activity'." },
                activity: { type: Type.STRING, description: "The main activity or task for this step." },
                considerations: { type: Type.STRING, description: "Key considerations, tools, or frameworks for this step." },
                output: { type: Type.STRING, description: "The expected output or deliverable for this step." },
              },
              required: ["id", "title", "activity", "considerations", "output"],
            },
          },
        },
        required: ["id", "title", "steps"],
      },
    },
  },
  required: ["phases"],
};

export const parseWorkflowFromText = async (text: string): Promise<Workflow> => {
  const prompt = `
    Parse the following project plan text and structure it into the provided JSON schema.
    For each step, extract the 'Activity', 'Considerations' (or 'Key Tools'/'Key Frameworks'), and 'Output'.
    The 'title' for each step should be a concise summary of the 'Activity'.
    Generate unique IDs for each phase and step. For example, 'phase-i' and 'step-1-1'.
    
    Project Plan Text:
    ---
    ${text}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: workflowSchema,
      },
    });

    const jsonResponse = JSON.parse(response.text);

    const workflowWithInteractiveFields: Workflow = {
        phases: jsonResponse.phases.map((phase: Omit<Phase, 'steps'> & { steps: Omit<Step, 'status' | 'agent' | 'subTasks'>[] }) => ({
            ...phase,
            steps: phase.steps.map((step) => ({
                ...step,
                status: 'To Do',
                agent: 'Unassigned',
                subTasks: [],
            })),
        })),
    };
    
    return workflowWithInteractiveFields;
  } catch (error) {
    console.error("Error calling Gemini API for workflow parsing:", error);
    throw new Error("Failed to parse workflow from text.");
  }
};

// --- Live AI Elaboration ---

const suggestionSchema = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            description: "A list of actionable suggestions.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "A short, descriptive title for the suggestion." },
                    description: { type: Type.STRING, description: "A detailed description of the suggestion." }
                },
                required: ["title", "description"]
            }
        }
    },
    required: ["suggestions"]
};

// Type guard for strict schema validation
function isValidSuggestionsResponse(data: any): data is SuggestionsResponse {
    return (
        data &&
        Array.isArray(data.suggestions) &&
        data.suggestions.every(
            (s: any) => typeof s.title === 'string' && typeof s.description === 'string'
        )
    );
}

export const elaborateOnText = async (sectionTitle: string, text: string): Promise<SuggestionsResponse> => {
    const prompt = `
        Given the following section from a project task, provide a list of 3-5 actionable and enumerated suggestions to elaborate on it.
        The suggestions should be concrete next steps, potential tools to use, or key questions to consider.
        
        Section Title: "${sectionTitle}"
        
        Current Text:
        ---
        ${text}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: suggestionSchema,
            },
        });

        const jsonResponse = JSON.parse(response.text);
        
        if (!isValidSuggestionsResponse(jsonResponse)) {
            console.error("Invalid suggestions response structure:", jsonResponse);
            throw new Error("Received an invalid response structure from the AI.");
        }

        return jsonResponse;

    } catch (error) {
        console.error("Error calling Gemini API for elaboration:", error);
        throw new Error(`Failed to get suggestions for "${sectionTitle}".`);
    }
}
