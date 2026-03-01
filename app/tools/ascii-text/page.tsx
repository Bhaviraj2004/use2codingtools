"use client";

import ToolNavbar from "@/app/components/toolsNavBar";
import { useState, useMemo } from "react";

// ── Types ─────────────────────────────────────────────────────
type FontKey = keyof typeof FONT_DATA;

// ── Full figlet-style fonts (hand-crafted) ────────────────────
// Each char is an array of rows. Height varies per font.
const FONT_DATA = {

  // ── Banner (classic wide) ────────────────────────────────
  "Banner": {
    h: 7,
    chars: {
      "A":["  ###  "," #   # ","#     #","#######","#     #","#     #","       "],
      "B":["######","#     #","#     #","######","#     #","#     #","######"],
      "C":[" #####","#     #","#      ","#      ","#      ","#     #"," #####"],
      "D":["##### ","#    #","#    #","#    #","#    #","#    #","##### "],
      "E":["#######","#      ","#      ","#####  ","#      ","#      ","#######"],
      "F":["#######","#      ","#      ","#####  ","#      ","#      ","#      "],
      "G":[" #####","#     #","#      ","#  ####","#     #","#     #"," #####"],
      "H":["#     #","#     #","#     #","#######","#     #","#     #","#     #"],
      "I":["#######","   #   ","   #   ","   #   ","   #   ","   #   ","#######"],
      "J":["  #####","    #  ","    #  ","    #  ","#   #  "," ###   ","       "],
      "K":["#    #","#   # ","#  #  ","###   ","#  #  ","#   # ","#    #"],
      "L":["#      ","#      ","#      ","#      ","#      ","#      ","#######"],
      "M":["#     #","##   ##","# # # #","#  #  #","#     #","#     #","#     #"],
      "N":["#     #","##    #","# #   #","#  #  #","#   # #","#    ##","#     #"],
      "O":[" #####","#     #","#     #","#     #","#     #","#     #"," #####"],
      "P":["######","#     #","#     #","######","#      ","#      ","#      "],
      "Q":[" #####","#     #","#     #","#  #  #","#   # #","#    ##"," ######"],
      "R":["######","#     #","#     #","######","#   #  ","#    # ","#     #"],
      "S":[" #####","#     #","#      "," ##### ","      #","#     #"," #####"],
      "T":["#######","   #   ","   #   ","   #   ","   #   ","   #   ","   #   "],
      "U":["#     #","#     #","#     #","#     #","#     #","#     #"," #####"],
      "V":["#     #","#     #"," #   # "," #   # ","  # #  ","  # #  ","   #   "],
      "W":["#     #","#  #  #","#  #  #","#  #  #"," # # # "," # # # ","  # #  "],
      "X":["#     #"," #   # ","  # #  ","   #   ","  # #  "," #   # ","#     #"],
      "Y":["#     #"," #   # ","  # #  ","   #   ","   #   ","   #   ","   #   "],
      "Z":["#######","     # ","    #  ","   #   ","  #    "," #     ","#######"],
      "0":[" ##### ","#     #","#    ##","#   # #","## #  #","#     #"," ##### "],
      "1":["  #    "," ##    ","# #    ","  #    ","  #    ","  #    ","#######"],
      "2":[" ##### ","#     #","      #"," ##### ","#      ","#      ","#######"],
      "3":[" ##### ","#     #","      #"," #####","      #","#     #"," ##### "],
      "4":["#      ","#    # ","#    # ","#######","     # ","     # ","     # "],
      "5":["#######","#      ","###### ","      #","      #","#     #"," ##### "],
      "6":[" ##### ","#      ","#      ","###### ","#     #","#     #"," ##### "],
      "7":["#######","     # ","    #  ","   #   ","  #    "," #     ","#      "],
      "8":[" ##### ","#     #","#     #"," ##### ","#     #","#     #"," ##### "],
      "9":[" ##### ","#     #","#     #"," ######","      #","      #"," ##### "],
      "!":["  #  ","  #  ","  #  ","  #  ","     ","  #  ","     "],
      "?":["#####","#   #","    #","   # ","  #  ","     ","  #  "],
      ".":["  ","  ","  ","  ","  "," #","  "],
      ",":["  ","  ","  ","  ","  "," #"," #"],
      " ":["   ","   ","   ","   ","   ","   ","   "],
    } as Record<string, string[]>,
  },

  // ── Block (filled squares) ────────────────────────────────
  "Block": {
    h: 5,
    chars: {
      "A":["▄███▄","█   █","█████","█   █","█   █"],
      "B":["████ ","█   █","████ ","█   █","████ "],
      "C":["▄████","█    ","█    ","█    ","▀████"],
      "D":["████ ","█   █","█   █","█   █","████ "],
      "E":["█████","█    ","████ ","█    ","█████"],
      "F":["█████","█    ","████ ","█    ","█    "],
      "G":["▄████","█    ","█  ██","█   █","▀████"],
      "H":["█   █","█   █","█████","█   █","█   █"],
      "I":["█████","  █  ","  █  ","  █  ","█████"],
      "J":["█████","   █ ","   █ ","█  █ "," ██  "],
      "K":["█   █","█  █ ","███  ","█  █ ","█   █"],
      "L":["█    ","█    ","█    ","█    ","█████"],
      "M":["█   █","██ ██","█ █ █","█   █","█   █"],
      "N":["█   █","██  █","█ █ █","█  ██","█   █"],
      "O":["▄███▄","█   █","█   █","█   █","▀███▀"],
      "P":["████ ","█   █","████ ","█    ","█    "],
      "Q":["▄███▄","█   █","█ █ █","█  ██","▀████"],
      "R":["████ ","█   █","████ ","█  █ ","█   █"],
      "S":["▄████","█    ","▀███▄","    █","████▀"],
      "T":["█████","  █  ","  █  ","  █  ","  █  "],
      "U":["█   █","█   █","█   █","█   █","▀███▀"],
      "V":["█   █","█   █","█   █"," █ █ ","  █  "],
      "W":["█   █","█   █","█ █ █","██ ██","█   █"],
      "X":["█   █"," █ █ ","  █  "," █ █ ","█   █"],
      "Y":["█   █"," █ █ ","  █  ","  █  ","  █  "],
      "Z":["█████","   █ ","  █  "," █   ","█████"],
      "0":["▄███▄","█  ██","█ █ █","██  █","▀███▀"],
      "1":["  █  "," ██  ","  █  ","  █  ","█████"],
      "2":["▄███▄","    █"," ███ ","█    ","█████"],
      "3":["████ ","    █","████ ","    █","████▀"],
      "4":["█   █","█   █","█████","    █","    █"],
      "5":["█████","█    ","████ ","    █","████▀"],
      "6":["▄████","█    ","████ ","█   █","▀███▀"],
      "7":["█████","    █","   █ ","  █  ","  █  "],
      "8":["▄███▄","█   █","▀███▀","█   █","▀███▀"],
      "9":["▄███▄","█   █","▀████","    █","████▀"],
      "!":["  █  ","  █  ","  █  ","     ","  █  "],
      "?":["████ ","   █ ","  █  ","     ","  █  "],
      ".":["  ","  ","  ","  ","· "],
      ",":["  ","  ","  ","  ",",'"],
      " ":["   ","   ","   ","   ","   "],
    } as Record<string, string[]>,
  },

  // ── Slant (italic diagonal) ───────────────────────────────
  "Slant": {
    h: 6,
    chars: {
      "A":["   /\\   ","  /  \\  "," / /\\ \\ ","/____\\ ","/ __  \\","       "],
      "B":["______  ","| ___ \\ ","| |_/ / ","| ___ \\ ","| |_/ / ","\\____/  "],
      "C":["  ___  "," / __| ","| |    ","| |    "," \\___| ","       "],
      "D":["______  ","| ___ \\ ","| | | | ","| | | | ","| |/ /  ","\\___/   "],
      "E":["______  ","| ___ \\ ","| |_/ / ","| ___ \\ ","| |_/ / ","\\____/  "],
      "F":["______  ","| ___ \\ ","| |_/ / ","| ___ \\ ","| |     ","\\|     "],
      "G":["  ___  "," / __| ","| | __ ","| |_\\ \\","\\ \\___/ ","       "],
      "H":["_   _  ","| | | | ","| |_| | ","| ___ | ","| | | | ","\\| |/   "],
      "I":["_  ","| | ","| | ","| | ","| | ","\\|  "],
      "J":["   _ ","  | |","  | |","  | |","  | |","\\ | |"],
      "K":["_  __  ","| |/ / ","| ' /  ","| . \\  ","| |\\  \\ ","\\| \\_/ "],
      "L":["_      ","| |     ","| |     ","| |     ","| |____ ","\\______/"],
      "M":["__  __ ","| \\/  |","| |\\/| |","| |  | |","| |  | |","\\|  \\|  "],
      "N":["_   _  ","| \\ | | ","| \\| | ","| . ` | ","| |\\  | ","\\| \\_/ "],
      "O":["  ___  "," / _ \\ ","| | | |","| |_| |"," \\___/ ","       "],
      "P":["______  ","| ___ \\ ","| |_/ / ","|  __/  ","| |     ","\\|     "],
      "Q":["  ___  "," / _ \\ ","| | | |","| |_| |"," \\__\\_\\ ","       "],
      "R":["______  ","| ___ \\ ","| |_/ / ","|    /  ","| |\\ \\  ","\\| \\_\\ "],
      "S":[" _____  ","/ ____| ","\\___  \\ "," ___) | ","|____/  ","        "],
      "T":["_____  ","  |_  | ","   | |  ","   | |  ","   |_|  ","        "],
      "U":["_   _  ","| | | | ","| | | | ","| |_| | "," \\___/  ","       "],
      "V":["_   _  ","| | | | ","| | | | ","\\  /  /","  \\/ /","   \\/  "],
      "W":["__      _  ","| \\ /\\ / /","| |\\/| |   ","| |  | |   ","| |  | |   ","\\|  \\|    "],
      "X":["_   _  ","| \\ / |","|  V  |","| |\\/| |","\\ | / ","  \\_/ "],
      "Y":["_   _  ","| \\ / |","  > <  ","/  /\\ \\ ","/_/ \\_ \\","        "],
      "Z":["______  ","\\___  / ","  /  /  "," /  /__ ","/_____/ ","        "],
      "0":["  ___  "," / _ \\ ","| | | |","| |_| |"," \\___/ ","       "],
      "1":["  _ "," /| |","  | |","  | |","  |_|","     "],
      "2":["  ___ "," |__ \\","    ) ","  / /","  /_/ ","     "],
      "3":["  ___ "," |__ \\","   ) ","  / /","  |_| ","     "],
      "4":[" _  __","| |/_ /","| ' / ","| . \\ ","\\|  \\_\\","       "],
      "5":["  ___ "," | __|"," |_  \\","  __) |"," |___/ ","       "],
      "6":["  ____  "," / ___|","/ /___  ","| |___) |"," \\____/ ","        "],
      "7":["  ___ ","  |___\\","    / /","   / / ","  /_/  ","       "],
      "8":["  ___  "," ( _ ) "," / _ \\","| (_) |"," \\___/ ","       "],
      "9":["  ___  "," / _ \\ ","| (_) |"," \\__, |","   / / ","  /_/  "],
      "!":["  _  ","  | |","  | |","     "," |_| ","      "],
      "?":["  ___ "," |__ \\","   ) ","  /  ","  |_| ","       "],
      ".":["   ","   ","   ","  _","(_)","   "],
      ",":["   ","   ","   ","  _ "," ( )","  )' "],
      " ":["   ","   ","   ","   ","   ","   "],
    } as Record<string, string[]>,
  },

  // ── Thin (single-stroke minimalist) ──────────────────────
  "Thin": {
    h: 5,
    chars: {
      "A":[" /\\ "," /  \\"," /__\\"," /  \\"," /  \\"],
      "B":["|-- \\","|   |","|---<","|   |","|-- /"],
      "C":[" /--","| ","| "," \\--","    "],
      "D":["|-- \\","|   |","|   |","|   |","|-- /"],
      "E":["|---","| --","|   ","    ","|---"],
      "F":["|---","| --","|   ","    ","|   "],
      "G":[" /--","| ","| --","| ","|\\--"],
      "H":["|  |","|  |","|--|","|  |","|  |"],
      "I":["-|"," |"," |"," |","-|"],
      "J":["  |","  |","  |",". |","\\/ "],
      "K":["| /","|-< ","|\\ ","   \\","    \\"],
      "L":["|  ","|  ","|  ","|  ","|--"],
      "M":["|\\  /|","| \\/ |","|    |","|    |","|    |"],
      "N":["|\\  |","| \\ |","|  \\|","|   |","|   |"],
      "O":[" /--","| ","| "," \\--","    "],
      "P":["|-- \\","|  / ","|--< ","|    ","|    "],
      "Q":[" /--","| ","| ","  \\-"," /  "],
      "R":["|-- \\","|  / ","|--< ","| \\ ","    \\"],
      "S":[" /--","| "," \\--","   |","\\---"],
      "T":["---","  |","  |","  |","  |"],
      "U":["|  |","|  |","|  |","|  |"," \\/"],
      "V":["\\  /","\\  /","\\ / "," \\/ ","    "],
      "W":["\\   /","\\ / ","  |  "," / \\ ","/   \\"],
      "X":["\\  /"," \\/ "," /\\ ","/  \\","    "],
      "Y":["\\  /","\\ / "," |  ","  |  ","  |  "],
      "Z":["---","  /","/  "," /  ","---"],
      "0":[" -- ","|  |","|  |","|  |"," -- "],
      "1":[" | "," | "," | "," | "," | "],
      "2":[" -- ","   |"," -- ","|   "," ---"],
      "3":[" -- ","   |"," -- ","   |"," -- "],
      "4":["|  |","|  |"," --|","   |","   |"],
      "5":[" ---","|   "," -- ","   |"," -- "],
      "6":[" /--","| ","| --","|  |"," -- "],
      "7":[" ---","   |","  / ","  | ","  | "],
      "8":[" -- ","|  |"," -- ","|  |"," -- "],
      "9":[" -- ","|  |"," --|","   |"," -- "],
      "!":["| ","| ","| ","  ",". "],
      "?":["--","  |"," /-","   ","·  "],
      ".":["  ","  ","  ","  ","· "],
      ",":["  ","  ","  "," · ","·  "],
      " ":["  ","  ","  ","  ","  "],
    } as Record<string, string[]>,
  },

  // ── Shadow (double offset shadow) ───────────────────────
  "Shadow": {
    h: 5,
    chars: {
      "A":["  ▄▄   ","  ██   "," ▄██▄  ","██  ██ ","██  ██ "],
      "B":["███▄   ","██  ██ ","███▀   ","██  ██ ","███▀   "],
      "C":[" ▄███  ","██     ","██     ","██     "," ▀███  "],
      "D":["███▄   ","██  ██ ","██  ██ ","██  ██ ","███▀   "],
      "E":["█████  ","██     ","████   ","██     ","█████  "],
      "F":["█████  ","██     ","████   ","██     ","██     "],
      "G":[" ▄████ ","██     ","██  ██ ","██  ██ "," ████▀ "],
      "H":["██  ██ ","██  ██ ","██████ ","██  ██ ","██  ██ "],
      "I":["█████  ","  ██   ","  ██   ","  ██   ","█████  "],
      "J":["  ████ ","   ██  ","   ██  ","█  ██  "," ▀██▀  "],
      "K":["██  ██ ","██ ██  ","████   ","██ ██  ","██  ██ "],
      "L":["██     ","██     ","██     ","██     ","██████ "],
      "M":["██   ██","███ ███","██ █ ██","██   ██","██   ██"],
      "N":["██   ██","███  ██","██ █ ██","██  ███","██   ██"],
      "O":[" ████  ","██  ██ ","██  ██ ","██  ██ "," ████  "],
      "P":["████   ","██  ██ ","████   ","██     ","██     "],
      "Q":[" ████  ","██  ██ ","██  ██ ","██ ▄██ "," ███▄█ "],
      "R":["████   ","██  ██ ","████   ","██ ██  ","██  ██ "],
      "S":[" ████  ","██     "," ████  ","    ██ "," ████  "],
      "T":["██████ ","  ██   ","  ██   ","  ██   ","  ██   "],
      "U":["██  ██ ","██  ██ ","██  ██ ","██  ██ "," ████  "],
      "V":["██  ██ ","██  ██ ","██  ██ "," ████  ","  ██   "],
      "W":["██   ██","██   ██","██ █ ██","███ ███","██   ██"],
      "X":["██  ██ "," ████  ","  ██   "," ████  ","██  ██ "],
      "Y":["██  ██ "," ████  ","  ██   ","  ██   ","  ██   "],
      "Z":["██████ ","   ██  ","  ██   "," ██    ","██████ "],
      "0":[" ████  ","██  ██ ","██  ██ ","██  ██ "," ████  "],
      "1":["  ██   "," ███   ","  ██   ","  ██   ","██████ "],
      "2":[" ████  ","    ██ "," ████  ","██     ","██████ "],
      "3":[" ████  ","    ██ "," ████  ","    ██ "," ████  "],
      "4":["██  ██ ","██  ██ ","██████ ","    ██ ","    ██ "],
      "5":["██████ ","██     ","█████  ","    ██ ","█████  "],
      "6":[" ████  ","██     ","█████  ","██  ██ "," ████  "],
      "7":["██████ ","    ██ ","   ██  ","  ██   ","  ██   "],
      "8":[" ████  ","██  ██ "," ████  ","██  ██ "," ████  "],
      "9":[" ████  ","██  ██ "," █████ ","    ██ "," ████  "],
      "!":["  ██ ","  ██ ","  ██ ","     ","  ██ "],
      "?":["████ ","   ██","  ██ ","     ","  ██ "],
      ".":["  ","  ","  ","  ","██"],
      ",":["  ","  ","  ","██","█ "],
      " ":["   ","   ","   ","   ","   "],
    } as Record<string, string[]>,
  },

  // ── Bubble (rounded letters) ─────────────────────────────
  "Bubble": {
    h: 5,
    chars: {
      "A":["  .:.  "," .: :. "," :___: "," : .: "," :   : "],
      "B":[":::::. ",": .: : ",":::::. ",": .: : ",":::::'  "],
      "C":[".:::::",":.     ",":.     ","::.    ",".::::. "],
      "D":[":::::. ",":  .: :",":  .: :",":  .: ","::::.' "],
      "E":["::::::",":.    ","::::  ",":.    ","::::::"],
      "F":["::::::",":.    ","::::  ",":.    ",":.    "],
      "G":[".:::::",":.    ",":. :::",":.  : ",".::::. "],
      "H":[":.  .:",":.  .:","::::::",":.  .:",":.  .:"],
      "I":["::::::","  ::  ","  ::  ","  ::  ","::::::"],
      "J":["::::::","   :: ","   :: ",":..:  ",".:::. "],
      "K":[":.  .:",":..: ",":::   ",":. .: ",":.  .:"],
      "L":[":.    ",":.    ",":.    ",":.    ","::::::"],
      "M":[":.  .:","::.:.:",":.:.:.",":.  .:",":.  .:"],
      "N":[":.  .:",":::. .",":.:.:.",":.  ::",":.  .:"],
      "O":[".:::. ",":.  .:",":.  .:",":.  .:","'::: "],
      "P":[":::::. ",":.  .: ",":::::. ",":.     ",":.     "],
      "Q":[".:::. ",":.  .:",":.  .:",":..'.: ",".:::.'"],
      "R":[":::::. ",":.  .: ","::::.: ",":.  :. ",":.  .:"],
      "S":[" .:::::",":.     "," ::::.","     .:",".::::. "],
      "T":["::::::","  ::  ","  ::  ","  ::  ","  ::  "],
      "U":[":.  .:",":.  .:",":.  .:",":.  .:",".:::. "],
      "V":[":.  .:",":.  .:"," ::.. "," ::.. ","  ::  "],
      "W":[":.  .:",":.  .:",":.:.:.","::.:.:",":.  .:"],
      "X":[":.  .:"," ::.: ","  ::  "," :. : ",":.  .:"],
      "Y":[":.  .:"," ::.: ","  ::  ","  ::  ","  ::  "],
      "Z":["::::::","   .: ","  .:  ","..:   ","::::::"],
      "0":[".:::. ",":.  .:",":.  .:",":.  .:",".:::. "],
      "1":["  .:  ",".:::  ","  .:  ","  .:  ","::::::"],
      "2":[".:::. ","    .:",".::::",".:    ","::::::"],
      "3":[".::::","    .:","  ::: ","    .:",".::::"],
      "4":[".:  .:",".:  .:","::::::","    .:","    .:"],
      "5":["::::::",".:    ",".:::. ","    .:",".:::. "],
      "6":[".:::. ",".:    ",".:::. ",":.  .:",".:::. "],
      "7":["::::::","    .:","   .: ","  .:  ","  .:  "],
      "8":[".:::. ",":.  .:",".:::. ",":.  .:",".:::. "],
      "9":[".:::. ",":.  .",".:::.:","    .:",".:::. "],
      "!":[".:",".:",".:","  ",".:"],
      "?":[".::.","  .:",".:  ","    ",".:  "],
      ".":["  ","  ","  ","  ",".:"],
      ",":["  ","  ","  ",".:",".: "],
      " ":["  ","  ","  ","  ","  "],
    } as Record<string, string[]>,
  },

  // ── Double (double-line strokes) ─────────────────────────
  "Double": {
    h: 5,
    chars: {
      "A":["  ╔╗  "," ╠╣  ","╔╩╩╗ ","║  ║ ","╝  ╚ "],
      "B":["╔═╗  ","║ ╚╗ ","╠═╣  ","║ ╔╝ ","╚═╝  "],
      "C":["╔══╗","║   ","║   ","║   ","╚══╝"],
      "D":["╔═╗ ","║ ╚╗","║  ║","║ ╔╝","╚═╝ "],
      "E":["╔══╗","║   ","╠══ ","║   ","╚══╝"],
      "F":["╔══╗","║   ","╠══ ","║   ","║   "],
      "G":["╔══╗","║   ","║ ╔╗","║ ╚╝","╚══╝"],
      "H":["║  ║","║  ║","╠══╣","║  ║","║  ║"],
      "I":["╔══╗","  ║ ","  ║ ","  ║ ","╚══╝"],
      "J":["  ╔╗","  ║ ","  ║ ","╔═╝ ","╚══ "],
      "K":["║ ╔╝","║╔╝ ","╠╩╗ ","║╚╗ ","║ ╚╗"],
      "L":["║   ","║   ","║   ","║   ","╚══╗"],
      "M":["║╔╗║","╠╝╚╣","║  ║","║  ║","╝  ╚"],
      "N":["║╗ ║","╠╩╗║","║ ╚╣","║  ╝","╝  ╚"],
      "O":["╔══╗","║  ║","║  ║","║  ║","╚══╝"],
      "P":["╔══╗","║  ║","╚══╣","║   ","╝   "],
      "Q":["╔══╗","║  ║","║ ═╣","║  ╔","╚══╩"],
      "R":["╔══╗","║  ║","╠══╣","║ ╚╗","╝  ╚"],
      "S":["╔══╗","║   ","╚══╗","   ║","╚══╝"],
      "T":["╔══╗","  ║ ","  ║ ","  ║ ","  ╝ "],
      "U":["║  ║","║  ║","║  ║","║  ║","╚══╝"],
      "V":["║  ║","║  ║","╚╗╔╝"," ╚╝ ","  ╝ "],
      "W":["║  ║","║  ║","║╔╗║","╠╝╚╣","╝  ╚"],
      "X":["╗  ╔"," ╚╦╝"," ╔╩╗","╔╝ ╚╗","╝  ╚"],
      "Y":["║  ║"," ╚╦╝","  ║ ","  ║ ","  ╝ "],
      "Z":["╔══╗","  ╔╝"," ╔╝ ","╔╝  ","╚══╝"],
      "0":["╔══╗","║  ║","║  ║","║  ║","╚══╝"],
      "1":["  ╔ "," ╔╣ ","  ║ ","  ║ ","  ╩ "],
      "2":["╔══╗","   ║","╔══╝","║   ","╚══╗"],
      "3":["╔══╗","   ║","╚══╣","   ║","╚══╝"],
      "4":["║  ║","║  ║","╚══╣","   ║","   ╝"],
      "5":["╔══╗","║   ","╚══╗","   ║","╚══╝"],
      "6":["╔══╗","║   ","╠══╗","║  ║","╚══╝"],
      "7":["╔══╗","   ║","  ╔╝"," ╔╝ ","╔╝  "],
      "8":["╔══╗","║  ║","╠══╣","║  ║","╚══╝"],
      "9":["╔══╗","║  ║","╚══╣","   ║","╚══╝"],
      "!":["║ ","║ ","║ ","  ","╬ "],
      "?":["╔═╗","  ║"," ╔╝","   ","╔╬╗"],
      ".":["  ","  ","  ","  ","╬ "],
      ",":["  ","  ","  ","╬ ","╝ "],
      " ":["   ","   ","   ","   ","   "],
    } as Record<string, string[]>,
  },
} as const;

// ── Render ────────────────────────────────────────────────────
function renderFont(text: string, fontKey: FontKey, spacing = 1): string {
  const font = FONT_DATA[fontKey];
  const upper = text.toUpperCase();
  const chars = upper.split("");
  if (!chars.length) return "";

  const rows: string[][] = Array.from({ length: font.h }, () => []);
  const gap = " ".repeat(Math.max(0, spacing));

  chars.forEach((ch, ci) => {
    const glyph = font.chars[ch] ?? font.chars[" "] ?? Array(font.h).fill("  ");
    for (let r = 0; r < font.h; r++) {
      rows[r].push((glyph[r] ?? "  ") + (ci < chars.length - 1 ? gap : ""));
    }
  });

  return rows.map(r => r.join("")).join("\n");
}

// ── Color themes ──────────────────────────────────────────────
const COLOR_THEMES = [
  { key: "default",  label: "Default",  class: "text-slate-300" },
  { key: "emerald",  label: "Matrix",   class: "text-emerald-400" },
  { key: "violet",   label: "Purple",   class: "text-violet-400" },
  { key: "cyan",     label: "Cyan",     class: "text-cyan-400" },
  { key: "orange",   label: "Fire",     class: "text-orange-400" },
  { key: "pink",     label: "Pink",     class: "text-pink-400" },
  { key: "yellow",   label: "Gold",     class: "text-yellow-400" },
  { key: "rainbow",  label: "Rainbow",  class: "" },
];

const RAINBOW_ROWS = ["text-red-400","text-orange-400","text-yellow-400","text-emerald-400","text-cyan-400","text-violet-400","text-pink-400"];

// ── Border styles ─────────────────────────────────────────────
const BORDERS: Record<string, { tl:string,tr:string,bl:string,br:string,h:string,v:string } | null> = {
  "None":    null,
  "─ Single":{ tl:"┌",tr:"┐",bl:"└",br:"┘",h:"─",v:"│" },
  "═ Double":{ tl:"╔",tr:"╗",bl:"╚",br:"╝",h:"═",v:"║" },
  "╭ Round": { tl:"╭",tr:"╮",bl:"╰",br:"╯",h:"─",v:"│" },
  "# Hash":  { tl:"#",tr:"#",bl:"#",br:"#",h:"#",v:"#" },
  "* Star":  { tl:"*",tr:"*",bl:"*",br:"*",h:"*",v:"*" },
  "~ Wave":  { tl:"~",tr:"~",bl:"~",br:"~",h:"~",v:"~" },
};

function applyBorder(art: string, style: string): string {
  const b = BORDERS[style];
  if (!b) return art;
  const lines = art.split("\n");
  const w = Math.max(...lines.map(l => l.length));
  const top = b.tl + b.h.repeat(w + 2) + b.tr;
  const bot = b.bl + b.h.repeat(w + 2) + b.br;
  const mid = lines.map(l => b.v + " " + l.padEnd(w) + " " + b.v);
  return [top, ...mid, bot].join("\n");
}

const EXAMPLES = [
  { label: "Hello", text: "Hello" },
  { label: "Code",  text: "Code"  },
  { label: "Love",  text: "Love"  },
  { label: "404",   text: "404"   },
  { label: "2025",  text: "2025"  },
];

export default function AsciiText() {
  const [text, setText]       = useState("Hello");
  const [fontKey, setFontKey] = useState<FontKey>("Block");
  const [colorKey, setColorKey] = useState("emerald");
  const [border, setBorder]   = useState("None");
  const [spacing, setSpacing] = useState(1);
  const [copied, setCopied]   = useState(false);
  const [previewAll, setPreviewAll] = useState(false);

  const art = useMemo(() => {
    const raw = renderFont(text, fontKey, spacing);
    return applyBorder(raw, border);
  }, [text, fontKey, spacing, border]);

  const copy = () => {
    navigator.clipboard.writeText(art);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([art], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ascii-${text.slice(0, 12)}.txt`;
    a.click();
  };

  const colorTheme = COLOR_THEMES.find(t => t.key === colorKey)!;

  const renderColored = (artStr: string) => {
    if (colorKey !== "rainbow") {
      return <pre className={`font-mono text-sm leading-tight whitespace-pre select-all overflow-x-auto ${colorTheme.class}`}>{artStr}</pre>;
    }
    return (
      <pre className="font-mono text-sm leading-tight whitespace-pre select-all overflow-x-auto">
        {artStr.split("\n").map((line, i) => (
          <span key={i} className={RAINBOW_ROWS[i % RAINBOW_ROWS.length]}>{line}{"\n"}</span>
        ))}
      </pre>
    );
  };

  const fontKeys = Object.keys(FONT_DATA) as FontKey[];

  return (
    <main className="min-h-screen bg-[#09090f] text-slate-200 font-sans">
      <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage:"linear-gradient(rgba(0,255,136,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,0.025) 1px,transparent 1px)", backgroundSize:"44px 44px" }} />
      <div className="fixed -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-orange-500/[0.05] blur-3xl pointer-events-none" />
      <div className="fixed -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-violet-500/[0.04] blur-3xl pointer-events-none" />

      {/* NAV */}

      <ToolNavbar toolName="ASCII Text" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-orange-500/10 flex items-center justify-center font-mono font-bold text-orange-400 text-xs">Aa</div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">ASCII Text Generator</h1>
            <span className="font-mono text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded">6 fonts</span>
          </div>
          <p className="text-slate-500 text-sm">Convert any text into stylised ASCII art letters. Choose from 6 fonts, 8 color themes, 7 borders, and adjustable letter spacing.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">

          {/* ── Controls ── */}
          <div className="flex flex-col gap-4">

            {/* Text input */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Text</div>
              <input value={text} onChange={e => setText(e.target.value.slice(0, 14))}
                placeholder="Type here…"
                className="w-full font-mono text-2xl font-bold bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-slate-200 outline-none focus:border-orange-500/40 transition-colors tracking-widest uppercase" />
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {EXAMPLES.map(ex => (
                  <button key={ex.text} onClick={() => setText(ex.text)}
                    className="font-mono text-[10px] px-2 py-0.5 border border-white/[0.08] text-slate-600 rounded hover:text-orange-400 hover:border-orange-500/30 transition-all">{ex.label}</button>
                ))}
              </div>
            </div>

            {/* Font selector */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Font</div>
              <div className="flex flex-col gap-1.5">
                {fontKeys.map(f => (
                  <button key={f} onClick={() => setFontKey(f)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all text-left ${fontKey === f ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "border-white/[0.06] text-slate-500 hover:border-white/[0.14] hover:text-slate-300"}`}>
                    <span className="font-mono text-xs font-semibold">{f}</span>
                    <span className="font-mono text-[8px] text-slate-700 ml-2">{FONT_DATA[f].h}px</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Color</div>
              <div className="grid grid-cols-2 gap-1.5">
                {COLOR_THEMES.map(t => (
                  <button key={t.key} onClick={() => setColorKey(t.key)}
                    className={`font-mono text-[11px] px-2 py-1.5 rounded border transition-all ${colorKey === t.key ? "bg-orange-500/10 border-orange-500/30" : "border-white/[0.06] hover:border-white/[0.14]"}`}>
                    <span className={`font-semibold ${t.class || "bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 bg-clip-text text-transparent"}`}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Border */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-3">Border</div>
              <div className="flex flex-col gap-1.5">
                {Object.keys(BORDERS).map(b => (
                  <button key={b} onClick={() => setBorder(b)}
                    className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all text-left ${border === b ? "bg-orange-500/10 border-orange-500/30 text-orange-400" : "border-white/[0.06] text-slate-600 hover:text-slate-300 hover:border-white/[0.14]"}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
              <div className="flex justify-between mb-2">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Letter Spacing</span>
                <span className="font-mono text-xs text-orange-400">{spacing}</span>
              </div>
              <input type="range" min={0} max={4} step={1} value={spacing} onChange={e => setSpacing(+e.target.value)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background:`linear-gradient(to right,#f97316 0%,#f97316 ${(spacing/4)*100}%,rgba(255,255,255,0.1) ${(spacing/4)*100}%,rgba(255,255,255,0.1) 100%)` }} />
              <div className="flex justify-between mt-1">
                <span className="font-mono text-[9px] text-slate-700">tight</span>
                <span className="font-mono text-[9px] text-slate-700">wide</span>
              </div>
            </div>

          </div>

          {/* ── Output ── */}
          <div className="flex flex-col gap-4">

            {/* Toolbar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600">Output</span>
                {art && <span className="font-mono text-[10px] text-slate-700">{art.split("\n").length} lines · {art.length} chars</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPreviewAll(p => !p)}
                  className={`font-mono text-[11px] px-3 py-1.5 rounded border transition-all ${previewAll ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "border-white/[0.08] text-slate-500 hover:text-slate-300"}`}>
                  All fonts
                </button>
                <button onClick={download} disabled={!art}
                  className="font-mono text-[11px] px-3 py-1.5 rounded border border-white/[0.08] text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-all">
                  ↓ .txt
                </button>
                <button onClick={copy} disabled={!art}
                  className={`font-mono text-[11px] px-4 py-1.5 rounded border transition-all ${copied ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-orange-500/15 border-orange-500/30 text-orange-400 hover:bg-orange-500/25 disabled:opacity-30"}`}>
                  {copied ? "✓ Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Main output */}
            <div className="bg-[#06060f] border border-white/[0.08] rounded-2xl p-6 min-h-48 overflow-auto">
              {art
                ? renderColored(art)
                : <div className="flex items-center justify-center h-32 font-mono text-slate-700">Type something above…</div>
              }
            </div>

            {/* All-fonts preview */}
            {previewAll && text && (
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-xl p-5">
                <div className="font-mono text-[11px] uppercase tracking-[2px] text-slate-600 mb-4">All Fonts Preview</div>
                <div className="flex flex-col gap-6">
                  {fontKeys.map(f => {
                    const preview = applyBorder(renderFont(text, f, spacing), border);
                    const isActive = f === fontKey;
                    return (
                      <div key={f} onClick={() => setFontKey(f)} className="cursor-pointer group">
                        <div className={`font-mono text-[10px] uppercase tracking-widest mb-2 transition-colors ${isActive ? "text-orange-400" : "text-slate-700 group-hover:text-slate-500"}`}>
                          {f} {isActive && "← active"}
                        </div>
                        <pre className={`font-mono text-xs leading-tight whitespace-pre overflow-x-auto transition-colors ${isActive ? colorTheme.class || "text-orange-400" : "text-slate-700 group-hover:text-slate-500"}`}>
                          {preview}
                        </pre>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats */}
            {art && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Font",    val: fontKey },
                  { label: "Lines",   val: String(art.split("\n").length) },
                  { label: "Width",   val: String(Math.max(...art.split("\n").map(l => l.length))) + "ch" },
                  { label: "Chars",   val: String(art.length) },
                ].map(s => (
                  <div key={s.label} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-3 text-center">
                    <div className="font-mono text-base font-bold text-orange-400">{s.val}</div>
                    <div className="font-mono text-[9px] text-slate-700 uppercase tracking-wider mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-6">
          {[
            { icon: "🅰️", title: "6 Fonts",      desc: "Banner, Block, Slant, Thin, Shadow, Bubble, Double — each a unique art style." },
            { icon: "🎨", title: "8 Colors",     desc: "Default, Matrix, Purple, Cyan, Fire, Pink, Gold, Rainbow themes." },
            { icon: "⬜", title: "7 Borders",    desc: "Wrap your art in single, double, rounded, hash, star, or wave borders." },
            { icon: "↔️", title: "Spacing",      desc: "Adjust letter spacing from tight to wide with a single slider." },
          ].map(c => (
            <div key={c.title} className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-4">
              <div className="text-xl mb-2">{c.icon}</div>
              <div className="font-semibold text-slate-300 text-sm mb-1">{c.title}</div>
              <div className="text-slate-600 text-xs leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}