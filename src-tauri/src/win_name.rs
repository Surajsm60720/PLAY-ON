use winapi::shared::windef::HWND;
use winapi::um::winnt::LPWSTR;
use winapi::um::winuser::{
    GetForegroundWindow, GetWindowTextLengthW, GetWindowTextW, IsWindowVisible,
};

unsafe fn get_foreground_window() -> Option<HWND> {
    let hwnd = GetForegroundWindow();
    if hwnd.is_null() {
        None
    } else {
        Some(hwnd)
    }
}

unsafe fn get_window_title(hwnd: HWND) -> Option<String> {
    if IsWindowVisible(hwnd) == 0 {
        return None;
    }

    let length = GetWindowTextLengthW(hwnd);
    if length == 0 {
        return None;
    }

    let mut buffer: Vec<u16> = vec![0; (length + 1) as usize];

    let written = GetWindowTextW(hwnd, buffer.as_mut_ptr() as LPWSTR, length + 1);

    if written == 0 {
        return None;
    }

    String::from_utf16(&buffer[..written as usize]).ok()
}

pub fn get_active_window_title() -> Option<String> {
    unsafe {
        let hwnd = get_foreground_window()?;
        get_window_title(hwnd)
    }
}
