import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

function DummyComponent() {
  return <h1>Vitest frontend ready</h1>;
}

describe("frontend test environment", () => {
  it("renders a React component", () => {
    render(<DummyComponent />);

    expect(screen.getByRole("heading", { name: "Vitest frontend ready" })).toBeDefined();
  });
});
