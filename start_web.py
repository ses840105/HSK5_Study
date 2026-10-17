#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HSK 5급 웹 퀴즈 로컬 서버 및 브라우저 자동 실행기
"""
import os
import sys
import socket
import webbrowser
import http.server
import socketserver
import threading
import time
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def sync_vocab_bundle():
    """vocab/*.json 및 ielts/*.json 파일들을 vocab_data.js 로 번들링하여 file:// 직접 열기 완벽 지원"""
    try:
        vocab_dir = os.path.join(BASE_DIR, "vocab")
        ielts_dir = os.path.join(BASE_DIR, "ielts")

        hsk_files = {
            "vocab": "hsk5_core_vocabulary.json",
            "colloc": "hsk5_collocations.json",
            "chengyu": "hsk5_chengyu.json",
            "cloze": "hsk5_cloze.json",
            "grammar": "hsk5_grammar.json",
            "listening": "hsk5_listening.json",
            "dictation": "hsk5_dictation.json",
            "reading": "hsk5_reading.json"
        }
        ielts_files = {
            "vocab": "ielts_vocab.json",
            "listening": "ielts_listening.json",
            "idioms": "ielts_idioms.json",
            "cloze": "ielts_cloze.json",
            "grammar": "ielts_grammar.json",
            "dictation": "ielts_dictation.json",
            "reading": "ielts_reading.json"
        }

        bundle = {"hsk": {}, "ielts": {}}
        for key, fname in hsk_files.items():
            fpath = os.path.join(vocab_dir, fname)
            bundle["hsk"][key] = json.load(open(fpath, "r", encoding="utf-8")) if os.path.exists(fpath) else []
        for key, fname in ielts_files.items():
            fpath = os.path.join(ielts_dir, fname)
            bundle["ielts"][key] = json.load(open(fpath, "r", encoding="utf-8")) if os.path.exists(fpath) else []

        out_path = os.path.join(BASE_DIR, "vocab_data.js")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("// HSK 5급 & IELTS 통합 다국어 데이터 번들 (CORS 제한 없는 즉시 로딩 지원)\n")
            # 하위 호환성을 위해 window.HSK5_DATA 유지 및 window.APP_DATA 제공
            f.write("window.HSK5_DATA = " + json.dumps(bundle["hsk"], ensure_ascii=False, indent=2) + ";\n")
            f.write("window.IELTS_DATA = " + json.dumps(bundle["ielts"], ensure_ascii=False, indent=2) + ";\n")
            f.write("window.APP_DATA = " + json.dumps(bundle, ensure_ascii=False, indent=2) + ";\n")
    except Exception as e:
        print(f"[알림] vocab_data.js 번들링 생략: {e}")

def find_available_port(start_port=8000, max_port=8080):
    for port in range(start_port, max_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(('127.0.0.1', port))
                return port
            except OSError:
                continue
    return 8000

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)
    
    def log_message(self, format, *args):
        # 터미널 출력 간소화
        pass

def main():
    sync_vocab_bundle()
    port = find_available_port()
    url = f"http://127.0.0.1:{port}/index.html"
    
    # 0.5초 후 기본 브라우저 자동 실행
    def open_browser():
        time.sleep(0.5)
        print(f"🌐 웹 브라우저를 엽니다: {url}")
        try:
            webbrowser.open(url)
        except Exception as e:
            print(f"브라우저 실행 실패 (URL로 수동 접속해 주세요): {e}")

    threading.Thread(target=open_browser, daemon=True).start()

    print("=" * 60)
    print("🇨🇳 [HSK 5급 인터랙티브 웹 퀴즈 서비스 구동]")
    print(f"👉 로컬 웹서버 실행 주소: {url}")
    print("👉 종료하려면 터미널에서 Ctrl + C 를 누르세요.")
    print("=" * 60)

    try:
        with ReusableTCPServer(("127.0.0.1", port), CustomHTTPHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n웹 서버를 안전하게 종료했습니다. 수고하셨습니다!")

if __name__ == "__main__":
    main()
