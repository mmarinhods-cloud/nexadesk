import type { Message, Ticket } from "@/lib/local/types";

export interface AIProvider {
  analyzeSentiment(text: string): "positive" | "neutral" | "negative" | "frustrated";
  suggestTags(text: string): string[];
  generateReply(ticket: Ticket, messages: Message[]): string;
  summarizeThread(ticket: Ticket, messages: Message[]): string[];
  rewriteText(text: string, style: "concise" | "formal" | "friendly" | "clear" | "translate"): string;
}

export const mockAIProvider: AIProvider = {
  analyzeSentiment(text) {
    const normalized = text.toLowerCase();
    if (/frustrad|inaceit|absurd|angry|unacceptable/.test(normalized)) return "frustrated";
    if (/erro|falha|cobrad|issue|failed/.test(normalized)) return "negative";
    if (/obrigad|ótim|thank|great/.test(normalized)) return "positive";
    return "neutral";
  },
  suggestTags(text) {
    const normalized = text.toLowerCase();
    const tags = new Set<string>();
    if (/cobran|fatura|invoice|billing|charge|refund/.test(normalized)) tags.add("billing");
    if (/api|endpoint|latency|429|401/.test(normalized)) tags.add("api");
    if (/senha|login|sso|saml|oauth|token/.test(normalized)) tags.add("authentication");
    if (/webhook|integration|integra/.test(normalized)) tags.add("integration");
    if (/erro|falha|bug|failed/.test(normalized)) tags.add("bug");
    return [...tags].slice(0, 3);
  },
  generateReply(ticket, messages) {
    const latestCustomerMessage = [...messages].reverse().find((message) => message.author_id === ticket.customer_id)?.body ?? ticket.description;
    const short = latestCustomerMessage.replace(/<[^>]+>/g, " ").slice(0, 110).trim();
    return `<p>Olá, ${ticket.customer_name.split(" ")[0]}.</p><p>Obrigado por detalhar a solicitação sobre <strong>${ticket.subject.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</strong>. Entendi que: ${short.replaceAll("<", "&lt;").replaceAll(">", "&gt;")}.</p><p>Vou verificar os registros e retornar com os próximos passos. Se puder compartilhar um horário aproximado e o identificador da tentativa, isso ajudará na análise.</p>`;
  },
  summarizeThread(ticket, messages) {
    const publicMessages = messages.filter((message) => message.visibility === "public");
    return [
      `Problema: ${ticket.subject}.`,
      `Ações: ${publicMessages.length - 1} resposta(s) públicas registradas pela equipe ou pelo cliente.`,
      `Situação: ${ticket.status === "resolved" || ticket.status === "closed" ? "atendimento concluído" : "atendimento em andamento"}.`,
    ];
  },
  rewriteText(text, style) {
    const plain = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (style === "concise") return `<p>${plain.split(/[.!?]/)[0].slice(0, 180)}.</p>`;
    if (style === "formal") return `<p>Prezado(a),</p><p>${plain}</p><p>Atenciosamente,<br>Equipe de Suporte</p>`;
    if (style === "friendly") return `<p>Olá! Obrigado por entrar em contato. ${plain} Se precisar de mais alguma coisa, estamos por aqui.</p>`;
    if (style === "translate") return `<p>${plain}</p><p><em>Tradução automática: revise o texto antes de enviar.</em></p>`;
    return `<p>${plain}</p>`;
  },
};

export function getAIProvider(): AIProvider {
  return mockAIProvider;
}
