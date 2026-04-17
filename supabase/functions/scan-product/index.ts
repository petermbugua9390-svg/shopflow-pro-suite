// AI product scanner — accepts a base64 image, returns suggested product fields
import { corsHeaders } from "@supabase/supabase-js/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'image' (base64 data URL)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a retail product identification expert for a Kenyan store. " +
              "Look at the product image (label, packaging, barcode if visible) and extract structured info. " +
              "Estimate selling price in Kenyan Shillings (KSh) for typical Kenyan retail. " +
              "If unsure about a value, make a reasonable estimate. Always call the tool.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify this product and return its details." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "identify_product",
              description: "Return identified product details for a Kenyan retail POS.",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Full product name including brand and variant" },
                  brand: { type: "string", description: "Brand or manufacturer" },
                  category: {
                    type: "string",
                    description: "Category, one of: Beverages, Snacks, Food, Dairy, Bakery, Household, Personal Care, Electronics, Clothing, Other",
                  },
                  barcode: { type: "string", description: "Barcode digits if visible, else empty string" },
                  unit: { type: "string", description: "Unit e.g. each, kg, litre, pack" },
                  estimated_price_ksh: { type: "number", description: "Estimated retail price in Kenyan Shillings" },
                  estimated_cost_ksh: { type: "number", description: "Estimated wholesale cost in Kenyan Shillings" },
                  description: { type: "string", description: "Brief one-line description, e.g. size/weight" },
                  confidence: { type: "number", description: "0 to 1 confidence score" },
                },
                required: ["name", "category", "unit", "estimated_price_ksh", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "identify_product" } },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("AI gateway error", response.status, text);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests, please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI scan failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Could not identify product from image" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-product error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
