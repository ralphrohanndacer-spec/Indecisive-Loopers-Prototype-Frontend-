const baseUrl = "https://indecisive-loopers-backend.onrender.com";

export async function getStallId(id) {
  const url = `${baseUrl}/stalls/id/${id}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(displayErrorMessage(response.status));
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

export async function getStallName(name) {
  const url = `${baseUrl}/stalls/name/${name}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(displayErrorMessage(response.status));
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

export async function getStallAvailability(is_open) {
  const url = `${baseUrl}/stalls/availability/${is_open}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(displayErrorMessage(response.status));
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

export async function getMenuItemId(id) {
  const url = `${baseUrl}/menu-items/id/${id}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(displayErrorMessage(response.status));
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

export async function getMenuItemAll() {
  const url = `${baseUrl}/menu-items`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(displayErrorMessage(response.status));
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

export async function getMenuItemDefault() {
  const url = `${baseUrl}/menu-items/default`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(displayErrorMessage(response.status));
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

export async function getMenuItemName(name) {
  const url = `${baseUrl}/menu-items/name/${name}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(displayErrorMessage(response.status));
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

export async function getMenuItemLocation(location) {
  const url = `${baseUrl}/menu-items/location/${location}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(displayErrorMessage(response.status));
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

export async function getMenuItemCategory(category) {
  const url = `${baseUrl}/menu-items/category/${category}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(displayErrorMessage(response.status));
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

export async function getMenuItemBudget(budget) {
  const url = `${baseUrl}/menu-items/budget/${budget}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(displayErrorMessage(response.status));
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

export async function getMenuItemBestSeller() {
  const url = `${baseUrl}/menu-items/best-seller`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(displayErrorMessage(response.status));
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { error: error.message };
  }
}

function displayErrorMessage(statusCode) {
  switch (statusCode) {
    case 400:
      return "Bad Request: Please check your input.";
    case 404:
      return "Not Found: No menu items or stalls matched your search.";
    case 422:
      return "Unprocessable Content: Please check the format of your input.";
    case 500:
      return "Internal Server Error: Please try again later.";
    case 502:
      return "Bad Gateway: Invalid response from the server.";
    case 503:
      return "Service Unavailable: The server is currently down.";
    case 504:
      return "Gateway Timeout: No response from the server.";
    default:
      return `An unexpected error occurred (Status code: ${statusCode}).`;
  }
}
