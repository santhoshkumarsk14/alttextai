// Chat API endpoint for micro SaaS backend
import { InvokeLLMRealTime } from '@/integrations/Core';

export async function POST(request) {
  try {
    const { prompt, file_urls, user_id, session_id } = await request.json();

    // Validate request
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check user quota/limits (for SaaS)
    const userQuota = await checkUserQuota(user_id);
    if (!userQuota.canProceed) {
      return new Response(JSON.stringify({ 
        error: 'Quota exceeded', 
        limit: userQuota.limit,
        used: userQuota.used 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          
          const aiResponse = await InvokeLLMRealTime({
            prompt,
            file_urls,
            response_json_schema: {
              type: "object",
              properties: {
                response: { type: "string" },
                alt_text: { type: "string" },
                seo_score: { type: "number" },
                keywords: { type: "array", items: { type: "string" } }
              }
            },
            onChunk: (chunk) => {
              fullResponse += chunk;
              // Send chunk to client
              controller.enqueue(`data: ${JSON.stringify({ chunk, type: 'chunk' })}\n\n`);
            },
            onProgress: (progress) => {
              // Send progress to client
              controller.enqueue(`data: ${JSON.stringify({ progress, type: 'progress' })}\n\n`);
            }
          });

          // Store in database for analytics
          await storeChatMessage({
            user_id,
            session_id,
            prompt,
            response: fullResponse,
            file_urls,
            ai_response: aiResponse,
            timestamp: new Date()
          });

          // Update usage metrics
          await updateUserUsage(user_id, 'chat');

          // Send completion signal
          controller.enqueue(`data: ${JSON.stringify({ 
            type: 'complete', 
            ai_response: aiResponse 
          })}\n\n`);
          
          controller.close();
        } catch (error) {
          console.error('Chat API error:', error);
          controller.enqueue(`data: ${JSON.stringify({ 
            type: 'error', 
            error: 'AI processing failed' 
          })}\n\n`);
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper functions for SaaS features
async function checkUserQuota(userId) {
  // In production, check against database
  // For demo, return mock quota
  return {
    canProceed: true,
    limit: 1000,
    used: 150
  };
}

async function storeChatMessage(data) {
  // In production, store in database
  console.log('Storing chat message:', data);
}

async function updateUserUsage(userId, type) {
  // In production, update usage metrics in database
  console.log('Updating user usage:', { userId, type });
}

