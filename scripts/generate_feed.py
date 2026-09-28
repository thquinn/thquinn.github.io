"""Generate an RSS 2.0 feed from the site's numbered Markdown posts."""

import argparse
from datetime import datetime, time, timezone
from email.utils import format_datetime
from html import unescape
from pathlib import Path
import re
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
BLOG = ROOT / "resources" / "blog"
SITE_URL = "https://thquinn.github.io/"


def summary(markdown: str) -> str:
    """Use the first prose paragraph, without Markdown formatting, as a teaser."""
    body = markdown.split("#STARTSCRIPTS", 1)[0]
    for paragraph in re.split(r"\n\s*\n", body):
        paragraph = paragraph.strip()
        if not paragraph or paragraph.startswith(("#", "![", "<", "```")):
            continue
        paragraph = re.sub(r"!\[[^]]*\]\([^)]*\)", "", paragraph)
        paragraph = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", paragraph)
        paragraph = re.sub(r"<[^>]+>", "", paragraph)
        paragraph = unescape(paragraph)
        paragraph = re.sub(r"[*_`]+", "", paragraph)
        paragraph = " ".join(paragraph.split())
        if paragraph:
            if len(paragraph) > 350:
                paragraph = paragraph[:351].rsplit(" ", 1)[0].rstrip(" ,;:") + "…"
            return paragraph
    return "Read this post on Tom's Blog."


def posts():
    entries = []
    for number, line in enumerate((BLOG / "index.txt").read_text(encoding="utf-8-sig").splitlines()):
        date_text, separator, title = line.partition(": ")
        if not separator or not title.strip():
            raise ValueError(f"Invalid blog index entry on line {number + 1}: {line!r}")
        date = datetime.strptime(date_text, "%m/%d/%Y").date()
        post_file = BLOG / f"{number}.md"
        if not post_file.is_file():
            raise FileNotFoundError(f"Blog index entry {number} has no matching post: {post_file}")
        entries.append((date, number, title.strip(), summary(post_file.read_text(encoding="utf-8-sig"))))
    return sorted(entries, key=lambda entry: (entry[0], entry[1]), reverse=True)


def generate(output: Path) -> None:
    rss = ET.Element("rss", version="2.0")
    channel = ET.SubElement(rss, "channel")
    for tag, value in (
        ("title", "Tom's Blog"),
        ("link", SITE_URL),
        ("description", "Blog posts by Tom Quinn."),
        ("language", "en-us"),
        ("lastBuildDate", format_datetime(datetime.now(timezone.utc), usegmt=True)),
    ):
        ET.SubElement(channel, tag).text = value

    for date, number, title, teaser in posts():
        item = ET.SubElement(channel, "item")
        url = f"{SITE_URL}blog.html?post={number}"
        for tag, value in (
            ("title", title),
            ("link", url),
            ("description", teaser),
            ("pubDate", format_datetime(datetime.combine(date, time.min, timezone.utc), usegmt=True)),
        ):
            ET.SubElement(item, tag).text = value
        ET.SubElement(item, "guid", isPermaLink="true").text = url

    ET.indent(rss, space="  ")
    output.parent.mkdir(parents=True, exist_ok=True)
    ET.ElementTree(rss).write(output, encoding="utf-8", xml_declaration=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "feed.xml", help="Output path (default: site root/feed.xml)")
    args = parser.parse_args()
    generate(args.output)
    print(f"Generated {args.output}")
