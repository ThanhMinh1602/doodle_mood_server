// utils.js
function formatUploadedBy(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
  };
}

module.exports = { formatUploadedBy };
