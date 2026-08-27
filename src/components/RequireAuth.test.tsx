import { screen, waitFor } from "@testing-library/react";
import { routerMock } from "@/test-utils/nextNavigation";
import { ADMIN_USER, CUSTOMER_USER, renderAs } from "@/test-utils/render";
import RequireAuth from "./RequireAuth";

const SECRET = "Only for signed-in eyes";

describe("RequireAuth", () => {
  it("sends a signed-out visitor to the sign-in page", async () => {
    renderAs(null, <RequireAuth>{SECRET}</RequireAuth>);

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
  });

  it("renders the page for a signed-in customer", () => {
    renderAs(CUSTOMER_USER, <RequireAuth>{SECRET}</RequireAuth>);

    expect(screen.getByText(SECRET)).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  describe("with a required role", () => {
    it("renders the page for the shop admin", () => {
      renderAs(ADMIN_USER, <RequireAuth role="ADMIN">{SECRET}</RequireAuth>);

      expect(screen.getByText(SECRET)).toBeInTheDocument();
    });

    it("keeps a customer out of an admin page", () => {
      renderAs(CUSTOMER_USER, <RequireAuth role="ADMIN">{SECRET}</RequireAuth>);

      expect(screen.queryByText(SECRET)).not.toBeInTheDocument();
      expect(
        screen.getByText("This page is for the shop admin"),
      ).toBeInTheDocument();
    });

    it("does not bounce a signed-in customer back to sign in", () => {
      // They already have a session; another sign-in form would not help.
      renderAs(CUSTOMER_USER, <RequireAuth role="ADMIN">{SECRET}</RequireAuth>);

      expect(routerMock.replace).not.toHaveBeenCalled();
    });
  });
});
