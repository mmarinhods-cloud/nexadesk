"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({ id, name = "password", autoComplete, minLength, maxLength, required = true }: {
  id: string;
  name?: string;
  autoComplete: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return <span className="password-control">
    <input id={id} className="text-input" name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} maxLength={maxLength} required={required} autoCapitalize="off" spellCheck={false}/>
    <button type="button" className="password-toggle" onClick={() => setVisible((current) => !current)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible} title={visible ? "Ocultar senha" : "Mostrar senha"}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button>
  </span>;
}
