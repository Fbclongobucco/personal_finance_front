/** Thrown for any non-2xx response. `message` is the backend's ProblemDetail "detail" field. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    this.name = "NetworkError";
  }
}
