import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

function Probe() {
  const [value, setValue] = useState("12.5");
  return (
    <>
      <label htmlFor="p">Price</label>
      <input
        id="p"
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <output>{JSON.stringify(value)}</output>
    </>
  );
}

it("debug: what clear + type leaves in a number input", async () => {
  const user = userEvent.setup();
  render(<Probe />);

  await user.clear(screen.getByLabelText("Price"));
  await user.type(screen.getByLabelText("Price"), "19.99");

  // eslint-disable-next-line no-console
  console.log("FINAL VALUE:", screen.getByRole("status").textContent);
});
