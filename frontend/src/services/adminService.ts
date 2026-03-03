// adminService removed — kept for compatibility but disabled
const unsupported = () => {
  throw new Error("adminService is deprecated. Admin Tools were removed from the UI.");
};

export default { createEntity: unsupported, fetchEntity: unsupported };
