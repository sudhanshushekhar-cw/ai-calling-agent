const sessions = new Map();

export function getMemory(callSid) {
  return sessions.get(callSid) || [];
}

export function addMemory(callSid, role, content, limit) {
  const history = sessions.get(callSid) || [];
  history.push({ role, content });
  sessions.set(callSid, history.slice(-limit));
}
