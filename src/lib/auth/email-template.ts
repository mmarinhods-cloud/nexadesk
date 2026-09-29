function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function accountEmailContent(purpose: "verify_email" | "reset_password", link: string) {
  const verify = purpose === "verify_email";
  const subject = verify ? "Confirme seu e-mail no NexaDesk" : "Redefina sua senha no NexaDesk";
  const heading = verify ? "Confirme seu e-mail" : "Redefina sua senha";
  const description = verify
    ? "Sua conta está quase pronta. Confirme este endereço para acessar as solicitações e acompanhar cada atendimento."
    : "Recebemos uma solicitação para criar uma nova senha. Acesse o link abaixo para continuar com segurança.";
  const button = verify ? "Confirmar e-mail" : "Criar nova senha";
  const expiry = verify ? "24 horas" : "30 minutos";
  const safeLink = escapeHtml(link);
  const text = `NEXADESK · SEGURANÇA DA CONTA\n\n${heading}\n\n${description}\n\n${button}: ${link}\n\nEste link expira em ${expiry}. Use o computador em que o NexaDesk está rodando.\n\nSe você não fez esta solicitação, ignore este e-mail. Sua conta não será alterada.`;
  const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:#eaf0f5;color:#152b3e;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eaf0f5;padding:36px 16px">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px">
        <tr><td style="padding:0 4px 20px">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:36px;height:36px;background:#0969b6;border-radius:7px;color:#ffffff;text-align:center;font-size:19px;font-weight:700">N</td>
            <td style="padding-left:11px;font-size:20px;font-weight:700;letter-spacing:-.5px;color:#102b41">NexaDesk</td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #d5e1eb;border-top:5px solid #0969b6;border-radius:13px">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr><td style="padding:39px 38px 14px">
              <p style="margin:0 0 14px;color:#075a9e;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Segurança da conta</p>
              <h1 style="margin:0 0 17px;color:#102b41;font-size:29px;line-height:1.2;letter-spacing:-.6px">${heading}</h1>
              <p style="margin:0;color:#4e6071;font-size:15px;line-height:1.7">${description}</p>
            </td></tr>
            <tr><td style="padding:14px 38px 32px">
              <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#0969b6;border-radius:8px"><a href="${safeLink}" style="display:inline-block;padding:15px 23px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none">${button}</a></td></tr></table>
            </td></tr>
            <tr><td style="padding:0 38px 29px">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#eff6fb;border-left:3px solid #0969b6;border-radius:5px"><tr><td style="padding:14px 16px;color:#334b5f;font-size:13px;line-height:1.6">Este link expira em <strong>${expiry}</strong>. Abra-o no computador em que o NexaDesk está rodando.</td></tr></table>
            </td></tr>
            <tr><td style="padding:0 38px 36px">
              <p style="margin:0 0 7px;color:#627486;font-size:12px;line-height:1.6">Se o botão não funcionar, copie este endereço:</p>
              <p style="margin:0;overflow-wrap:anywhere;word-break:break-word;font-size:12px;line-height:1.6"><a href="${safeLink}" style="color:#075a9e;text-decoration:underline">${safeLink}</a></p>
            </td></tr>
            <tr><td style="padding:18px 38px;border-top:1px solid #e1e9f0;color:#627486;font-size:12px;line-height:1.6">Se você não fez esta solicitação, ignore este e-mail. Sua conta não será alterada.</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:19px 4px;color:#6c7e8f;font-size:11px;line-height:1.5">NexaDesk · Atendimento com clareza</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, text, html };
}
