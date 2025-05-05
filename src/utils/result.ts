export type Ok<T> = {
  ok: true;
  value: T;
};

export function ok<T>(value: T): Ok<T> {
  return {
    ok: true,
    value,
  };
}

export type Error<E> = {
  ok: false;
  error: E;
};

export function error<E>(error: E): Error<E> {
  return {
    ok: false,
    error,
  };
}

export type Result<T, E> = Ok<T> | Error<E>;

export type UserInputError = {
  type: "user-input";
  message: string;
};

export function userInputError(message: string): UserInputError {
  return {
    type: "user-input",
    message,
  };
}
