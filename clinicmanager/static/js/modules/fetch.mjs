export class Fetcher {
  #defaults = {
    errorMessage: "Could not send the data.",
  };

  static sendJsonData = async (url, data, method = "post") => {
    data = data instanceof FormData ? Object.fromEntries(data) : data;

    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
      body: JSON.stringify(data),
    };
    const result = {
      message: "",
      success: true,
      data: null,
      redirect: null,
    };
    const response = await fetch(url, options);

    if (response.ok) {
      const data = await response.json();
      result.message = data.message;
      result.redirect = data.redirect;

      if (data.success) result.data = data.data;
      else result.success = false;
    } else {
      result.message = this.defaults.errorMessage;
      result.success = false;
    }

    return result;
  };

  get defaults() {
    return this.#defaults;
  }
}
