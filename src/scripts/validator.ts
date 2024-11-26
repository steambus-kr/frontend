type ValidateFunction = (value: string) => PlainResult;
type Continuer = (callback: ValidateFunction) => Result;

type PlainResult = {
  ok: true;
  break?: boolean;
} | {
  ok: false;
  message: string;
}
type Result = PlainResult & {
  t: Continuer
}

const bypasser = (result: PlainResult): Continuer => {
  return function internal(_) {
    return {
      ...result,
      t: internal,
    };
  };
}


export default function validator(onError: (key: string, message: string) => void) {
  return function t(key: string, value: string) {
    function _t(callback: (value: string) => PlainResult): Result {
      const result = callback(value);
      if (!result.ok) {
        onError(key, result.message);
        return {
          ...result,
          t: bypasser(result),
        };
      } else if (result.break) {
        return {
          ...result,
          t: bypasser(result),
        };
      } else {
        return {
          ...result,
          t: _t,
        };
      }
    }

    return {
      t: _t,
    };
  };
}

export const optional: ValidateFunction = (value) => {
  if (value === "") return { ok: true, break: true };
  return {
    ok: true,
  };
}

export const uint: ValidateFunction = (value) => {
  const i = parseInt(value);
  if (isNaN(i)) {
    return {
      ok: false,
      message: `정수만 입력할 수 있습니다`,
    };
  }
  if (i < 0) {
    return {
      ok: false,
      message: "값이 0보다 커야 합니다.",
    };
  }
  return {
    ok: true,
  };
}

export const or: (...values: string[]) => ValidateFunction = (...values) => {
  return (v) => {
    for (const value of values) {
      if (v === value) return {
        ok: true,
      }
    }

    return {
      ok: false,
      message: `${values.join(", ")} 중 하나여야 합니다.`
    }
  }
}