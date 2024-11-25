function b(v) {
  return function e(_) {
    return {
      ...v,
      t: e,
    };
  };
}

export default function validator(onError) {
  return function t(key, value) {
    function _t(callback) {
      const result = callback(value);
      if (!result.ok) {
        onError(key, result.message);
        return {
          ...result,
          t: b(result),
        };
      } else if (result.break) {
        return {
          ...result,
          t: b(result),
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

export function optional(value) {
  if (value === "") return { ok: true, break: true };
  return {
    ok: true,
  };
}

export function uint(value) {
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

export function or(...values) {
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