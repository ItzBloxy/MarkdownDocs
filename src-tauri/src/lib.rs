/// Returns the file path passed as the first CLI arg (e.g. when launched via
/// "Open with MarkdownDocs" from the OS file explorer), or None if no file
/// was passed. Filtered to .md/.markdown/.txt extensions and verified to exist.
#[tauri::command]
fn get_initial_file_path() -> Option<String> {
  std::env::args().nth(1).filter(|s| {
    let lower = s.to_ascii_lowercase();
    (lower.ends_with(".md") || lower.ends_with(".markdown") || lower.ends_with(".txt"))
      && std::path::Path::new(s).is_file()
  })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![get_initial_file_path])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
