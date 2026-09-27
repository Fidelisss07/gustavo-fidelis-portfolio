export function createSessionController({
  connect,
  onState,
  onMessage,
  onError,
  maxDuration = 180000,
}) {
  let session = null,
    generation = 0,
    pending = false,
    timer;
  const active = () => Boolean(session) || pending;
  async function stop() {
    generation++;
    pending = false;
    clearTimeout(timer);
    const previous = session;
    session = null;
    onState("idle");
    if (previous) await previous.endSession().catch(() => {});
  }
  async function start({ agentId, textOnly = false }) {
    if (active()) return false;
    const token = ++generation;
    pending = true;
    onState("connecting");
    const current = () => token === generation;
    try {
      const created = await connect(
        {
          agentId,
          textOnly,
          connectionType: textOnly ? "websocket" : "webrtc",
          onMessage: (message) => {
            if (current()) onMessage(message);
          },
          onModeChange: ({ mode }) => {
            if (current()) onState(textOnly ? "text" : mode);
          },
          onDisconnect: (details) => {
            if (current()) {
              generation++;
              session = null;
              pending = false;
              clearTimeout(timer);
              onState("idle");
              if (details?.reason === "error") onError("connection");
            }
          },
          onError: () => {
            if (current()) {
              void stop();
              onError("connection");
            }
          },
        },
        current,
      );
      if (!current()) {
        await created.endSession();
        return false;
      }
      session = created;
      pending = false;
      onState(textOnly ? "text" : "listening");
      timer = setTimeout(() => {
        void stop();
        onError("duration");
      }, maxDuration);
      return true;
    } catch (error) {
      if (current()) {
        await stop();
        onError(
          error?.name === "NotAllowedError" ? "microphone" : "connection",
        );
      }
      return false;
    }
  }
  return {
    start,
    stop,
    active,
    send: (text) => session?.sendUserMessage(text),
    mute: (value) => session?.setMicMuted?.(value),
  };
}
