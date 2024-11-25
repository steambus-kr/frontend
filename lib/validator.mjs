function e() {
  return {
    t: e,
  };
}

export default function validator(onError) {
  return function t(value) {
    function _t(callback) {
      const result = callback(value);
      if (!result.ok) {
        onError(result.message);
        return {
          t: e,
        };
      } else if (result.break) {
        return {
          t: e,
        };
      } else {
        return {
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
}
