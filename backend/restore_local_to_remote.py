import asyncio
import json
import os
import sys
import httpx

async def main():
    dump_path = os.path.join(os.path.dirname(__file__), "local_dump.json")
    if not os.path.exists(dump_path):
        print(f"ERROR: {dump_path} does not exist.")
        sys.exit(1)

    with open(dump_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"Loaded local snapshot from {dump_path}:")
    print(f"  • Users:        {len(data.get('guest_users', []))}")
    print(f"  • Memes:        {len(data.get('memes', []))}")
    print(f"  • Swipes:       {len(data.get('user_swipes', []))}")
    print(f"  • Saved Memes:  {len(data.get('saved_memes', []))}")
    print(f"  • Friendships:  {len(data.get('friendships', []))}")
    print(f"  • Chat Messages:{len(data.get('chat_messages', []))}")

    api_url = "https://memeswipe.up.railway.app"
    secret = "memeswipe123"

    for i, arg in enumerate(sys.argv):
        if arg == "--api-url" and i + 1 < len(sys.argv):
            api_url = sys.argv[i + 1]
        elif arg == "--secret" and i + 1 < len(sys.argv):
            secret = sys.argv[i + 1]

    endpoint = f"{api_url.rstrip('/')}/api/admin/import-data?secret={secret}&replace_all=true"
    print(f"\nUploading local snapshot to remote API: {endpoint} ...")

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(endpoint, json=data)
        if resp.status_code == 200:
            print("✓ SUCCESS! Remote database successfully updated with local data:")
            print(resp.json())
        else:
            print(f"✖ Failed with status {resp.status_code}: {resp.text}")

if __name__ == "__main__":
    asyncio.run(main())
