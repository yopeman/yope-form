import { NextResponse } from 'next/server';
import { getUserSheet, getUserSheetsTab } from '@/lib/google-sheets';
import { getSession, loginSession, logoutSession } from '@/lib/session';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, currentPassword, newPassword } = await request.json();

    const userSheet = await getUserSheet();
    const rows = await userSheet.getRows();
    const userRow = rows.find(r => r.get('uuid') === session.user.uuid);

    if (!userRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password if they want to change password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
      }
      
      const isValid = await bcrypt.compare(currentPassword, userRow.get('password_hash'));
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid current password' }, { status: 401 });
      }
      
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);
      userRow.assign({ password_hash: hash });
    }

    if (username && username !== session.user.username) {
      userRow.assign({ username });
    }

    await userRow.save();

    // Update session with new username
    const updatedUser = {
      uuid: session.user.uuid,
      email: session.user.email,
      username: username || session.user.username
    };
    
    await loginSession(updatedUser);

    return NextResponse.json({ message: 'Profile updated', user: updatedUser }, { status: 200 });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userSheet = await getUserSheet();
    const userRows = await userSheet.getRows();
    const userRow = userRows.find(r => r.get('uuid') === session.user.uuid);

    if (userRow) {
      await userRow.delete();
    }

    // Also delete their sheets from user_sheets to clean up
    try {
      const sheetsTab = await getUserSheetsTab();
      const sheetRows = await sheetsTab.getRows();
      const userSheets = sheetRows.filter(r => r.get('user_id') === session.user.uuid);
      for (const row of userSheets) {
        await row.delete();
      }
    } catch (e) {
      console.warn('Failed to delete user sheets during account deletion', e);
    }

    await logoutSession();

    return NextResponse.json({ message: 'Account deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
