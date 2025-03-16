{pkgs}: {
  deps = [
    pkgs.libGLU
    pkgs.libGL
    pkgs.iana-etc
    pkgs.postgresql
    pkgs.openssl
  ];
}
